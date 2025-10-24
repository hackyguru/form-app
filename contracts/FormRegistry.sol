// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FormRegistry
 * @dev Registry for privacy-preserving forms with dual privacy modes
 * Supports both identified (track submitters) and anonymous (private) submissions
 */
contract FormRegistry {
    address public serverWallet;
    address public owner;
    
    enum PrivacyMode { IDENTIFIED, ANONYMOUS }
    
    struct Form {
        address creator;
        string ipnsName;
        string encryptedKeyCID;    // CID of encrypted IPNS private key on IPFS
        PrivacyMode privacyMode;
        uint256 createdAt;
        bool active;
    }
    
    struct IdentifiedSubmission {
        string formId;
        string encryptedDataCID;  // IPFS CID of encrypted submission
        address submitter;         // Submitter's wallet address
        uint256 timestamp;
        bool verified;             // Was identity verified via Privy?
        string identityType;       // "wallet", "email", "google", "twitter", etc.
    }
    
    struct AnonymousSubmission {
        string formId;
        string encryptedDataCID;  // IPFS CID of encrypted submission
        uint256 timestamp;
        // No submitter address - maximum privacy!
    }
    
    // Form storage
    mapping(string => Form) public forms;
    mapping(address => string[]) public creatorForms;
    
    // Submission storage
    IdentifiedSubmission[] public identifiedSubmissions;
    AnonymousSubmission[] public anonymousSubmissions;
    
    // Form → Submission mappings
    mapping(string => uint256[]) public formIdentifiedSubmissions;
    mapping(string => uint256[]) public formAnonymousSubmissions;
    
    // Events
    event FormCreated(
        address indexed creator,
        string indexed formId,
        string ipnsName,
        string encryptedKeyCID,
        PrivacyMode privacyMode,
        uint256 timestamp
    );
    
    event IdentifiedSubmissionReceived(
        string indexed formId,
        uint256 submissionId,
        address indexed submitter,
        bool verified,
        uint256 timestamp
    );
    
    event AnonymousSubmissionReceived(
        string indexed formId,
        uint256 submissionId,
        uint256 timestamp
    );
    
    event FormStatusChanged(string indexed formId, bool active);
    
    event EncryptedKeyUpdated(string indexed formId, string newEncryptedKeyCID);
    
    modifier onlyServer() {
        require(msg.sender == serverWallet, "Only server wallet");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }
    
    modifier onlyFormCreator(string memory formId) {
        require(forms[formId].creator == msg.sender, "Not form creator");
        _;
    }
    
    constructor(address _serverWallet) {
        serverWallet = _serverWallet;
        owner = msg.sender;
    }
    
    /**
     * @dev Register a new form with privacy mode
     * @param creator Address of the form creator
     * @param formId Unique form identifier
     * @param ipnsName IPNS name for the form (k51...)
     * @param encryptedKeyCID CID of encrypted IPNS private key on IPFS
     * @param privacyMode Privacy mode (IDENTIFIED or ANONYMOUS)
     */
    function registerForm(
        address creator,
        string memory formId,
        string memory ipnsName,
        string memory encryptedKeyCID,
        PrivacyMode privacyMode
    ) external onlyServer {
        require(forms[formId].creator == address(0), "Form already exists");
        require(creator != address(0), "Invalid creator address");
        
        forms[formId] = Form({
            creator: creator,
            ipnsName: ipnsName,
            encryptedKeyCID: encryptedKeyCID,
            privacyMode: privacyMode,
            createdAt: block.timestamp,
            active: true
        });
        
        creatorForms[creator].push(formId);
        
        emit FormCreated(creator, formId, ipnsName, encryptedKeyCID, privacyMode, block.timestamp);
    }
    
    /**
     * @dev Submit response to an IDENTIFIED form
     * @param formId Form identifier
     * @param encryptedDataCID IPFS CID of encrypted response data
     * @param submitter Submitter's address (or address(0) for optional anonymous)
     * @param verified Was identity verified through Privy?
     * @param identityType Type of identity ("wallet", "email", "google", etc.)
     */
    function submitIdentifiedResponse(
        string memory formId,
        string memory encryptedDataCID,
        address submitter,
        bool verified,
        string memory identityType
    ) external onlyServer {
        require(forms[formId].active, "Form not active");
        require(forms[formId].privacyMode == PrivacyMode.IDENTIFIED, "Form is anonymous mode");
        
        identifiedSubmissions.push(IdentifiedSubmission({
            formId: formId,
            encryptedDataCID: encryptedDataCID,
            submitter: submitter,
            timestamp: block.timestamp,
            verified: verified,
            identityType: identityType
        }));
        
        uint256 submissionId = identifiedSubmissions.length - 1;
        formIdentifiedSubmissions[formId].push(submissionId);
        
        emit IdentifiedSubmissionReceived(
            formId,
            submissionId,
            submitter,
            verified,
            block.timestamp
        );
    }
    
    /**
     * @dev Submit response to an ANONYMOUS form
     * @param formId Form identifier
     * @param encryptedDataCID IPFS CID of encrypted response data
     */
    function submitAnonymousResponse(
        string memory formId,
        string memory encryptedDataCID
    ) external onlyServer {
        require(forms[formId].active, "Form not active");
        require(forms[formId].privacyMode == PrivacyMode.ANONYMOUS, "Form requires identity");
        
        anonymousSubmissions.push(AnonymousSubmission({
            formId: formId,
            encryptedDataCID: encryptedDataCID,
            timestamp: block.timestamp
        }));
        
        uint256 submissionId = anonymousSubmissions.length - 1;
        formAnonymousSubmissions[formId].push(submissionId);
        
        emit AnonymousSubmissionReceived(formId, submissionId, block.timestamp);
    }
    
    /**
     * @dev Get form details
     */
    function getForm(string memory formId) external view returns (Form memory) {
        return forms[formId];
    }
    
    /**
     * @dev Get all forms created by an address
     */
    function getCreatorForms(address creator) external view returns (string[] memory) {
        return creatorForms[creator];
    }
    
    /**
     * @dev Get identified submissions for a form
     */
    function getIdentifiedSubmissions(string memory formId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(
            forms[formId].privacyMode == PrivacyMode.IDENTIFIED,
            "Form is anonymous mode"
        );
        return formIdentifiedSubmissions[formId];
    }
    
    /**
     * @dev Get anonymous submissions for a form
     */
    function getAnonymousSubmissions(string memory formId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(
            forms[formId].privacyMode == PrivacyMode.ANONYMOUS,
            "Form is identified mode"
        );
        return formAnonymousSubmissions[formId];
    }
    
    /**
     * @dev Get form privacy mode
     */
    function getFormPrivacyMode(string memory formId) 
        external 
        view 
        returns (PrivacyMode) 
    {
        return forms[formId].privacyMode;
    }
    
    /**
     * @dev Check if address is form creator
     */
    function isFormCreator(string memory formId, address user) 
        external 
        view 
        returns (bool) 
    {
        return forms[formId].creator == user;
    }
    
    /**
     * @dev Toggle form active status (only creator)
     * Use false to "delete" (archive) a form
     */
    function setFormStatus(string memory formId, bool active) 
        external 
        onlyFormCreator(formId) 
    {
        forms[formId].active = active;
        emit FormStatusChanged(formId, active);
    }
    
    /**
     * @dev Update encrypted IPNS key CID (only creator)
     * Useful for key rotation or recovery
     */
    function updateEncryptedKey(string memory formId, string memory newEncryptedKeyCID) 
        external 
        onlyFormCreator(formId) 
    {
        require(bytes(newEncryptedKeyCID).length > 0, "Invalid CID");
        forms[formId].encryptedKeyCID = newEncryptedKeyCID;
        emit EncryptedKeyUpdated(formId, newEncryptedKeyCID);
    }
    
    /**
     * @dev Update server wallet (only owner)
     */
    function updateServerWallet(address newServerWallet) external onlyOwner {
        require(newServerWallet != address(0), "Invalid address");
        serverWallet = newServerWallet;
    }
    
    /**
     * @dev Get submission counts
     */
    function getFormSubmissionCount(string memory formId) 
        external 
        view 
        returns (uint256) 
    {
        if (forms[formId].privacyMode == PrivacyMode.IDENTIFIED) {
            return formIdentifiedSubmissions[formId].length;
        } else {
            return formAnonymousSubmissions[formId].length;
        }
    }
    
    /**
     * @dev Get total forms count
     */
    function getTotalFormsCount() external view returns (uint256) {
        // Note: This counts unique form creators, not total forms
        // For production, consider adding a counter
        return identifiedSubmissions.length + anonymousSubmissions.length;
    }
}
