#!/bin/bash


export FABRIC_CFG_PATH="./"

# Print the usage message
function printHelp() {
  echo "Usage: "
}

# Ask user for confirmation to proceed
function askProceed() {
  read -p "Continue? [Y/n] " ans
  case "$ans" in
  y | Y | "")
    echo "proceeding ..."
    ;;
  n | N)
    echo "exiting..."
    exit 1
    ;;
  *)
    echo "invalid response"
    askProceed
    ;;
  esac
}




# inspect Gensis Block and ChannelBlock(mychannel.tx).
function inspectBlocks() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    echo "configtxgen tool not found. exiting"
    exit 1
  fi
  configtxgen -inspectBlock genesis.block > genesis.json
  configtxgen -inspectChannelCreateTx mychannel.tx > mychannel.json
  configtxgen -inspectChannelCreateTx Org1MSPanchors.tx > Org1MSPanchors.json
  configtxgen -inspectChannelCreateTx Org2MSPanchors.tx > Org2MSPanchors.json
  echo
}

#generate gensis block and channel block and anchor peer update file
function generateBlocks() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    echo "configtxgen tool not found. exiting"
    exit 1
  fi

  echo "##########################################################"
  echo "#########  Generating Orderer Genesis block ##############"
  echo "##########################################################"
  # Note: For some unknown reason (at least for now) the block file can't be
  # named orderer.genesis.block or the orderer will fail to launch!
  echo "CONSENSUS_TYPE="$CONSENSUS_TYPE
  set -x
  configtxgen -outputBlock ./genesis.block -profile MultiNodeEtcdRaft
  res=$?
  set +x

  if [ $res -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "### Generating channel configuration transaction 'channel.tx' ###"
  echo "#################################################################"
  set -x
  configtxgen -profile IranScmTwoOrgsChannel -outputCreateChannelTx ./mychannel.tx -channelID mychannel
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for Org1MSP   ##########"
  echo "#################################################################"
  set -x
  configtxgen -profile IranScmTwoOrgsChannel -outputAnchorPeersUpdate ./Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for Org1MSP..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for Org2MSP   ##########"
  echo "#################################################################"
  set -x
  configtxgen -profile IranScmTwoOrgsChannel -outputAnchorPeersUpdate ./Org2MSPanchors.tx -channelID mychannel -asOrg Org2MSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for Org2MSP..."
    exit 1
  fi
  echo
  echo
}

# Generates Org certs using cryptogen tool
function generateOrdererMsp() {
  which cryptogen
  if [ "$?" -ne 0 ]; then
    echo "cryptogen tool not found. exiting"
    exit 1
  fi

  Dir1='crypto-config/ordererOrganizations/org1.iranscm.tk/'
  Dir2='crypto-config/ordererOrganizations/org2.iranscm.tk/'
  if [ -d $Dir1 ] || [ -d $Dir2 ]; then
    echo "Orderers MSP already exist" 
    exit 1
  fi

  echo
  echo "##########################################################"
  echo "##### Generate Orderer certificates using cryptogen tool #########"
  echo "##########################################################"

  set -x
  cryptogen generate --config=./cryptogen-orderer.yaml
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate certificates..."
    exit 1
  fi
  echo
  
}

# Generates Org certs using cryptogen tool
function generateOrgMsp() {
  which cryptogen
  if [ "$?" -ne 0 ]; then
    echo "cryptogen tool not found. exiting"
    exit 1
  fi

  Dir1='crypto-config/peerOrganizations/org1.iranscm.tk/'
  Dir2='crypto-config/peerOrganizations/org2.iranscm.tk/'
  if [ -d $Dir1 ] || [ -d $Dir2 ]; then
    echo "Orgs MSP already exist" 
    exit 1
  fi

  
  echo
  echo "##########################################################"
  echo "##### Generate certificates using cryptogen tool #########"
  echo "##########################################################"

  set -x
  cryptogen generate --config=./cryptogen.yaml
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate certificates..."
    exit 1
  fi
  echo
}


MODE=$1
shift
# Determine whether starting, stopping, restarting, generating or upgrading
if   [ "$MODE" == "inspectBlocks" ]; then
  EXPMODE="Inspecting all blocks"
elif [ "$MODE" == "generateBlocks" ]; then
  EXPMODE="Generating all blocks"
elif [ "$MODE" == "generateOrdererMsp" ]; then
  EXPMODE="Generating Orderer MSP"
elif [ "$MODE" == "generateOrgMsp" ]; then
  EXPMODE="Generating Org MSP"
else
  printHelp
  exit 1
fi

while getopts "h?" opt; do
  case "$opt" in
  h | \?)
    printHelp
    exit 0
    ;;
  esac
done

echo $EXPMODE

askProceed

#Create the network using docker compose
if   [ "$MODE" == "inspectBlocks" ]; then
  inspectBlocks
elif [ "$MODE" == "generateBlocks" ]; then
  generateBlocks
elif [ "$MODE" == "generateOrdererMsp" ]; then
  generateOrdererMsp
elif [ "$MODE" == "generateOrgMsp" ]; then
  generateOrgMsp
else
  printHelp
  exit 1
fi
