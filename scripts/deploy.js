const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying FormRegistry to Status Network Testnet...\n");

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
  // You'll need to set this in .env.local as SERVER_WALLET_ADDRESS
  const serverWallet = process.env.SERVER_WALLET_ADDRESS || deployer.address;
  console.log("🔐 Server wallet address:", serverWallet);
  
  if (!process.env.SERVER_WALLET_ADDRESS) {
    console.log("⚠️  WARNING: SERVER_WALLET_ADDRESS not set, using deployer address");
    console.log("   Set this in .env.local for production!\n");
  }

  // Deploy contract
  console.log("📦 Deploying FormRegistry contract...");
  const FormRegistry = await ethers.getContractFactory("FormRegistry");
  const formRegistry = await FormRegistry.deploy(serverWallet);

  await formRegistry.waitForDeployment();
  const contractAddress = await formRegistry.getAddress();

  console.log("\n✅ FormRegistry deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 View on explorer:", `https://sepoliascan.status.network/address/${contractAddress}`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    serverWallet: serverWallet,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    chainId: network.chainId.toString(),
    blockNumber: await ethers.provider.getBlockNumber(),
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
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Export ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FormRegistry.sol/FormRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const abiFile = path.join(__dirname, "../lib/FormRegistry.abi.json");
  fs.writeFileSync(abiFile, JSON.stringify(artifact.abi, null, 2));
  
  console.log("📄 ABI exported to:", abiFile);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Add to .env.local:");
  console.log(`   NEXT_PUBLIC_FORM_REGISTRY_ADDRESS=${contractAddress}`);
  console.log(`   SERVER_WALLET_PRIVATE_KEY=<your-server-wallet-private-key>`);
  console.log("\n2. Verify contract (optional):");
  console.log(`   npx hardhat verify --network statusTestnet ${contractAddress} ${serverWallet}`);
  console.log("\n3. Test the contract:");
  console.log("   - Create a form through the UI");
  console.log("   - Check Status Network explorer for transactions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
