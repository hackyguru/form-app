// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FormRegistryIPNS
 * @dev IPNS-first form registry with optional custom domains
 * Key changes:
 * - IPNS name is the primary ID (no more duplicate formId)
 * - Custom domain mapping for memorable URLs (monetizable feature)
 * - Cleaner architecture: one ID per form
 */
contract FormRegistryIPNS {
    address public serverWallet;
    address public owner;
    
    enum PrivacyMode { IDENTIFIED, ANONYMOUS }
    
    struct Form {
        address creator;
        string encryptedKeyCID;    // CID of encrypted IPNS private key on IPFS
        PrivacyMode privacyMode;
        uint256 createdAt;
        bool active;
        string customDomain;       // Optional custom domain (empty if none)
    }
    
    struct Response {
        string ipnsName;           // Form's IPNS name
        string responseCID;        // IPFS CID of response JSON data
        address submitter;         // Address (0x0 for anonymous)
        uint256 timestamp;
        bool verified;             // If identity was verified (for identified mode)
        string identityType;       // Type of identity verification (if applicable)
    }
    
    // Primary storage: IPNS → Form
    mapping(string => Form) public forms;
    
    // Creator tracking: address → IPNS names
    mapping(address => string[]) public creatorForms;
    
    // Custom domain mapping: customDomain → IPNS name
    mapping(string => string) public customDomains;
    
    // Reverse lookup: IPNS → check if domain exists
    mapping(string => bool) public hasCustomDomain;
    
    // Domain pricing and ownership
    uint256 public domainPrice = 0.01 ether; // Base price for custom domain
    mapping(string => address) public domainOwners;
    
    // Response storage - unified for both identified and anonymous
    Response[] public responses;
    
    // Form → Response mappings (using IPNS)
    mapping(string => uint256[]) public formResponses;
    
    // Events
    event FormCreated(
        address indexed creator,
        string indexed ipnsName,
        string encryptedKeyCID,
        PrivacyMode privacyMode,
        uint256 timestamp
    );
    
    event CustomDomainRegistered(
        string indexed ipnsName,
        string customDomain,
        address indexed owner,
        uint256 pricePaid
    );
    
    event CustomDomainReleased(
        string indexed ipnsName,
        string customDomain
    );
    
    event ResponseSubmitted(
        string indexed ipnsName,
        uint256 responseId,
        address indexed submitter,
        string responseCID,
        uint256 timestamp
    );
    
    event FormStatusChanged(string indexed ipnsName, bool active);
    
    event EncryptedKeyUpdated(string indexed ipnsName, string newEncryptedKeyCID);
    
    event DomainPriceUpdated(uint256 oldPrice, uint256 newPrice);
    
    modifier onlyServer() {
        require(msg.sender == serverWallet, "Only server wallet");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }
    
    modifier onlyFormCreator(string memory ipnsName) {
        require(forms[ipnsName].creator == msg.sender, "Not form creator");
        _;
    }
    
    constructor(address _serverWallet) {
        serverWallet = _serverWallet;
        owner = msg.sender;
    }
    
    /**
     * @dev Register a new form using IPNS as primary ID
     * @param creator Address of the form creator
     * @param ipnsName IPNS name (k51...) - this is now the primary ID!
     * @param encryptedKeyCID CID of encrypted IPNS private key on IPFS
     * @param privacyMode Privacy mode (IDENTIFIED or ANONYMOUS)
     */
    function registerForm(
        address creator,
        string memory ipnsName,
        string memory encryptedKeyCID,
        PrivacyMode privacyMode
    ) external onlyServer {
        require(forms[ipnsName].creator == address(0), "Form already exists");
        require(creator != address(0), "Invalid creator address");
        require(bytes(ipnsName).length > 0, "Invalid IPNS name");
        
        forms[ipnsName] = Form({
            creator: creator,
            encryptedKeyCID: encryptedKeyCID,
            privacyMode: privacyMode,
            createdAt: block.timestamp,
            active: true,
            customDomain: ""
        });
        
        creatorForms[creator].push(ipnsName);
        
        emit FormCreated(creator, ipnsName, encryptedKeyCID, privacyMode, block.timestamp);
    }
    
    /**
     * @dev Register a custom domain for a form (monetizable feature!)
     * @param ipnsName The IPNS name of the form
     * @param customDomain The desired custom domain (e.g., "my-awesome-form")
     */
    function registerCustomDomain(
        string memory ipnsName,
        string memory customDomain
    ) external payable onlyFormCreator(ipnsName) {
        require(forms[ipnsName].active, "Form not active");
        require(bytes(customDomain).length > 0, "Invalid domain");
        require(bytes(customDomains[customDomain]).length == 0, "Domain already taken");
        require(msg.value >= domainPrice, "Insufficient payment");
        
        // If form already has a domain, release it first
        if (bytes(forms[ipnsName].customDomain).length > 0) {
            string memory oldDomain = forms[ipnsName].customDomain;
            delete customDomains[oldDomain];
            delete domainOwners[oldDomain];
        }
        
        // Register new domain
        customDomains[customDomain] = ipnsName;
        domainOwners[customDomain] = msg.sender;
        forms[ipnsName].customDomain = customDomain;
        hasCustomDomain[ipnsName] = true;
        
        emit CustomDomainRegistered(ipnsName, customDomain, msg.sender, msg.value);
    }
    
    /**
     * @dev Release custom domain (form creator only)
     * @param ipnsName The IPNS name of the form
     */
    function releaseCustomDomain(string memory ipnsName) 
        external 
        onlyFormCreator(ipnsName) 
    {
        require(bytes(forms[ipnsName].customDomain).length > 0, "No custom domain");
        
        string memory domain = forms[ipnsName].customDomain;
        delete customDomains[domain];
        delete domainOwners[domain];
        forms[ipnsName].customDomain = "";
        hasCustomDomain[ipnsName] = false;
        
        emit CustomDomainReleased(ipnsName, domain);
    }
    
    /**
     * @dev Resolve a custom domain or IPNS to IPNS name
     * @param idOrDomain Either an IPNS name (k51...) or custom domain
     * @return The IPNS name
     */
    function resolveToIPNS(string memory idOrDomain) 
        external 
        view 
        returns (string memory) 
    {
        // Check if it's already an IPNS name (form exists)
        if (forms[idOrDomain].creator != address(0)) {
            return idOrDomain;
        }
        
        // Check if it's a custom domain
        string memory ipnsName = customDomains[idOrDomain];
        require(bytes(ipnsName).length > 0, "Domain not found");
        
        return ipnsName;
    }
    
    /**
     * @dev Submit a response to a form
     * @param ipnsName The IPNS name of the form
     * @param responseCID IPFS CID of the response JSON data
     * @param submitter Address of submitter (0x0 for anonymous)
     * @param verified Whether identity was verified
     * @param identityType Type of identity verification (empty for anonymous)
     */
    function submitResponse(
        string memory ipnsName,
        string memory responseCID,
        address submitter,
        bool verified,
        string memory identityType
    ) external onlyServer {
        require(forms[ipnsName].active, "Form not active");
        require(bytes(responseCID).length > 0, "Invalid response CID");
        
        // For anonymous forms, submitter should be 0x0
        if (forms[ipnsName].privacyMode == PrivacyMode.ANONYMOUS) {
            require(submitter == address(0), "Anonymous forms cannot have submitter address");
        }
        
        responses.push(Response({
            ipnsName: ipnsName,
            responseCID: responseCID,
            submitter: submitter,
            timestamp: block.timestamp,
            verified: verified,
            identityType: identityType
        }));
        
        uint256 responseId = responses.length - 1;
        formResponses[ipnsName].push(responseId);
        
        emit ResponseSubmitted(
            ipnsName,
            responseId,
            submitter,
            responseCID,
            block.timestamp
        );
    }
    
    /**
     * @dev Get form details by IPNS or custom domain
     */
    function getForm(string memory idOrDomain) external view returns (Form memory) {
        // Try direct IPNS lookup first
        if (forms[idOrDomain].creator != address(0)) {
            return forms[idOrDomain];
        }
        
        // Try custom domain lookup
        string memory ipnsName = customDomains[idOrDomain];
        require(bytes(ipnsName).length > 0, "Form not found");
        
        return forms[ipnsName];
    }
    
    /**
     * @dev Get all forms created by an address (returns IPNS names)
     */
    function getCreatorForms(address creator) external view returns (string[] memory) {
        return creatorForms[creator];
    }
    
    /**
     * @dev Toggle form active status (only creator)
     */
    function setFormStatus(string memory ipnsName, bool active) 
        external 
        onlyFormCreator(ipnsName) 
    {
        forms[ipnsName].active = active;
        emit FormStatusChanged(ipnsName, active);
    }
    
    /**
     * @dev Update encrypted IPNS key CID (only creator)
     */
    function updateEncryptedKey(string memory ipnsName, string memory newEncryptedKeyCID) 
        external 
        onlyFormCreator(ipnsName) 
    {
        require(bytes(newEncryptedKeyCID).length > 0, "Invalid CID");
        forms[ipnsName].encryptedKeyCID = newEncryptedKeyCID;
        emit EncryptedKeyUpdated(ipnsName, newEncryptedKeyCID);
    }
    
    /**
     * @dev Update domain price (only owner)
     */
    function updateDomainPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = domainPrice;
        domainPrice = newPrice;
        emit DomainPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Update server wallet (only owner)
     */
    function updateServerWallet(address newServerWallet) external onlyOwner {
        require(newServerWallet != address(0), "Invalid address");
        serverWallet = newServerWallet;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     * Revenue from custom domain registrations
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
    }
    
    /**
     * @dev Get response count for a form
     */
    function getFormResponseCount(string memory ipnsName) 
        external 
        view 
        returns (uint256) 
    {
        return formResponses[ipnsName].length;
    }
    
    /**
     * @dev Check if address is form creator
     */
    function isFormCreator(string memory ipnsName, address user) 
        external 
        view 
        returns (bool) 
    {
        return forms[ipnsName].creator == user;
    }
    
    /**
     * @dev Get all response IDs for a form
     */
    function getFormResponses(string memory ipnsName) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return formResponses[ipnsName];
    }
    
    /**
     * @dev Get a specific response by ID
     */
    function getResponse(uint256 responseId) 
        external 
        view 
        returns (Response memory) 
    {
        require(responseId < responses.length, "Invalid response ID");
        return responses[responseId];
    }
    
    /**
     * @dev Get all responses for a form (only for form creator)
     */
    function getFormResponseDetails(string memory ipnsName) 
        external 
        view 
        returns (Response[] memory) 
    {
        require(
            forms[ipnsName].creator == msg.sender,
            "Only form creator can view responses"
        );
        
        uint256[] memory responseIds = formResponses[ipnsName];
        Response[] memory formResponseList = new Response[](responseIds.length);
        
        for (uint256 i = 0; i < responseIds.length; i++) {
            formResponseList[i] = responses[responseIds[i]];
        }
        
        return formResponseList;
    }
}
