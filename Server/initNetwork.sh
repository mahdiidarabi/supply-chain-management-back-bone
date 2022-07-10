#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' https://stedolan.github.io/jq/ to execute this script"
	echo
	exit 1
fi

START_TIME=$(date +%s)

# Print the usage message
function printHelp () {
  echo "Usage: "
  echo "  ./testAPIs.sh -l golang|node"
  echo "    -p <port> - Server port 80\")"
}
# Language defaults to "golang"
LANGUAGE="golang"
ServerPort=4000
# Parse commandline args
while getopts "h?l?p:" opt; do
  case "$opt" in
    h|\?)
      printHelp
      exit 0
    ;;
	p)  ServerPort=$OPTARG
    ;;
  esac
done

##set chaincode path
function setChaincodePath(){
	LANGUAGE=`echo "$LANGUAGE" | tr '[:upper:]' '[:lower:]'`
	case "$LANGUAGE" in
		"golang")
		CC_SRC_PATH="github.com/example_cc/go"
		;;
		"node")
		CC_SRC_PATH="$PWD/artifacts/src/github.com/example_cc/node"
		;;
		*) printf "\n ------ Language $LANGUAGE is not supported yet ------\n"$
		exit 1
	esac
}

setChaincodePath

tput setaf 6
echo "POST request login admin on Org1  ..."
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/login \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Admin1&password=admin1pass&orgName=Org1')
echo $VALUES
ORG1_TOKEN=$(echo $VALUES | jq ".token" | sed "s/\"//g")
echo
echo "ORG1 token is $ORG1_TOKEN"

SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST request login admin on Org2 ..."
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/login \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Admin2&password=admin2pass&orgName=Org2')
echo $VALUES
ORG2_TOKEN=$(echo $VALUES | jq ".token" | sed "s/\"//g")
echo
echo "ORG2 token is $ORG2_TOKEN"

SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST request Create channel  ..."
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/channels/ \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"mychannel",
	"channelConfigPath":"../artifacts/channel/mychannel.tx"
}'
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

sleep 1

tput setaf 6
echo "POST request Join channel on Org1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/channels/mychannel/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.iranscm.tk","peer1.org1.iranscm.tk"]
}'
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST request Join channel on Org2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/channels/mychannel/peers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.iranscm.tk","peer1.org2.iranscm.tk"]
}'
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST request Update anchor peers on Org1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/channels/mychannel/anchorpeers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org1MSPanchors.tx"
}'
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST request Update anchor peers on Org2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/channels/mychannel/anchorpeers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org2MSPanchors.tx"
}'
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST Install chaincode on Org1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org1.iranscm.tk\",\"peer1.org1.iranscm.tk\"],
	\"chaincodeName\":\"mycc\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\"
}"
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST Install chaincode on Org2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/chaincodes \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org2.iranscm.tk\",\"peer1.org2.iranscm.tk\"],
	\"chaincodeName\":\"mycc\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\"
}"
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo

tput setaf 6
echo "POST instantiate chaincode on Org1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/fabric/channels/mychannel/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"chaincodeName\":\"mycc\",
	\"chaincodeVersion\":\"v0\",
	\"chaincodeType\": \"$LANGUAGE\"
}"
)

echo $VALUES
SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 1
  echo "------------------------- ERROR -------------------------"
  tput sgr 0
  ERROR_COUNT=$(($ERROR_COUNT+1))
fi
echo



END_TIME=$(date +%s)

DURATION=$(($END_TIME - $START_TIME))
echo "---------------- EXECUTION DURATION $DURATION ms  ---------------------"


echo
echo
echo
