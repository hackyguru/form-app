const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying FormRegistryIPNS to Status Network Testnet...\n");
  console.log("📋 NEW ARCHITECTURE: IPNS as Primary ID + Custom Domains");
  console.log("   - No more duplicate IDs (formId + IPNS)");
  console.log("   - IPNS name is the sole identifier");
  console.log("   - Optional custom domains for memorable URLs");
  console.log("   - Monetizable domain registration feature\n");

  // Get deployer account
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  if (!deployer) {
    throw new Error("No deployer account found. Please check your DEPLOYER_PRIVATE_KEY in .env.local");
  }
  
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Server wallet address (for backend signing)
  const serverWallet = process.env.SERVER_WALLET_ADDRESS || deployer.address;
  console.log("🔐 Server wallet address:", serverWallet);
  
  if (!process.env.SERVER_WALLET_ADDRESS) {
    console.log("⚠️  WARNING: SERVER_WALLET_ADDRESS not set, using deployer address");
    console.log("   Set this in .env.local for production!\n");
  }

  // Deploy contract
  console.log("📦 Deploying FormRegistryIPNS contract...");
  const FormRegistryIPNS = await ethers.getContractFactory("FormRegistryIPNS");
  const formRegistry = await FormRegistryIPNS.deploy(serverWallet);

  await formRegistry.waitForDeployment();
  const contractAddress = await formRegistry.getAddress();

  console.log("\n✅ FormRegistryIPNS deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 View on explorer:", `https://sepoliascan.status.network/address/${contractAddress}`);
  
  // Get initial domain price
  const domainPrice = await formRegistry.domainPrice();
  console.log("💎 Domain price:", ethers.formatEther(domainPrice), "ETH");
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "FormRegistryIPNS",
    contractAddress: contractAddress,
    serverWallet: serverWallet,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    chainId: network.chainId.toString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    domainPrice: ethers.formatEther(domainPrice),
    architecture: "IPNS-first with custom domains"
  };

  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-ipns.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Export ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FormRegistryIPNS.sol/FormRegistryIPNS.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiFile = path.join(__dirname, "../lib/FormRegistryIPNS.abi.json");
  fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
  
  console.log("📄 ABI exported to:", abiFile);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_FORM_REGISTRY_ADDRESS=${contractAddress}`);
  console.log(`   (Keep SERVER_WALLET_PRIVATE_KEY as is)`);
  console.log("\n2. Verify contract (optional):");
  console.log(`   npx hardhat verify --network statusTestnet ${contractAddress} ${serverWallet}`);
  console.log("\n3. Update frontend code:");
  console.log("   - Use IPNS as primary ID in form creation");
  console.log("   - Update routes to /forms/[ipnsName]/edit");
  console.log("   - Import FormRegistryIPNS.abi.json instead of FormRegistry.abi.json");
  console.log("\n4. Build custom domain UI:");
  console.log("   - Domain registration page");
  console.log("   - Payment flow (0.01 ETH base price)");
  console.log("   - Domain management in form settings");
  console.log("\n💰 Monetization ready: Custom domain feature can generate revenue!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
