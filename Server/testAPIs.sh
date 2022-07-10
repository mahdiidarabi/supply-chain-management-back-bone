#!/bin/bash

TEST_COUNT=0
ERROR_COUNT=0
SUCCESS_COUNT=0
WARNING_COUNT=0

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' https://stedolan.github.io/jq/ to execute this script"
	echo
	exit 1
fi

START_TIME=$(date +%s)

# Language defaults to "golang"
LANGUAGE="golang"
ServerPort=4000


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

##------------------ TEST REGISTER AND LOGIN PROCCESS API-----------------
tput setaf 6
echo "POST request Admin login on Org1  ..."
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
echo "POST request Admin Login on Org2 ..."
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
echo "POST register User 1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/register \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"user1\",
  \"password\":\"user1pass\",
  \"email\":\"user1@gmail.com\",
  \"name\":\"user1name\",
  \"familyname\":\"user1familyname\",
  \"userType\":\"source\"
}")
echo $VALUES

SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 3
  echo "------------------------ WARNING -----------------------"
  tput sgr 0
  WARNING_COUNT=$(($WARNING_COUNT+1))
fi
echo



tput setaf 6
echo "POST register User 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/register \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"user2\",
  \"password\":\"user2pass\",
  \"email\":\"user2@gmail.com\",
  \"name\":\"user2name\",
  \"familyname\":\"user2familyname\",
  \"userType\":\"supplier\"
}")
echo $VALUES

SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 3
  echo "------------------------ WARNING -----------------------"
  tput sgr 0
  WARNING_COUNT=$(($WARNING_COUNT+1))
fi
echo


tput setaf 6
echo "POST register User 3"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/register \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"user3\",
  \"password\":\"user3pass\",
  \"email\":\"user3@gmail.com\",
  \"name\":\"user3name\",
  \"familyname\":\"user3familyname\",
  \"userType\":\"source\"
}")
echo $VALUES

SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 3
  echo "------------------------ WARNING -----------------------"
  tput sgr 0
  WARNING_COUNT=$(($WARNING_COUNT+1))
fi
echo


tput setaf 6
echo "POST register New Admin"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/register \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"newAdmin\",
  \"password\":\"newadminpass\",
  \"email\":\"newAdmin@gmail.com\",
  \"name\":\"newAdminname\",
  \"familyname\":\"newAdminfamilyname\",
  \"userType\":\"admin1\"
}")
echo $VALUES

SUCCESS=$(echo $VALUES | jq ".success" | sed "s/\"//g")
TEST_COUNT=$(($TEST_COUNT+1))
if [[ "$SUCCESS" == "true" ]]; then
  tput setaf 2
  echo "------------------------ SUCCESS ------------------------"
  tput sgr 0
  SUCCESS_COUNT=$(($SUCCESS_COUNT+1))
else
  tput setaf 3
  echo "------------------------ WARNING -----------------------"
  tput sgr 0
  WARNING_COUNT=$(($WARNING_COUNT+1))
fi
echo


tput setaf 6
echo "POST Admin1 confirm user 1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/ConfirmUser \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"user1\",
  \"isConfirmed\":\"true\"
}")
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
echo "POST Admin1 confirm user 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/ConfirmUser \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"user2\",
  \"isConfirmed\":\"true\"
}")
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
echo "POST Admin1 confirm newAdmin"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/ConfirmUser \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"newAdmin\",
  \"isConfirmed\":\"true\",
  \"isAdmin\":\"true\"
}")
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
echo "POST request USER1 Login  ..."
tput sgr 0
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/login \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=user1&password=user1pass')
echo $VALUES
USER1_TOKEN=$(echo $VALUES | jq ".token" | sed "s/\"//g")
USER1_ACCNUM=$(echo $VALUES | jq ".accountNumber" | sed "s/\"//g")
echo
echo "User1 token is $USER1_TOKEN"
echo "User1 Account Number is $USER1_ACCNUM"

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
echo "POST request USER2 Login  ..."
tput sgr 0
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/login \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=user2&password=user2pass')
echo $VALUES
USER2_TOKEN=$(echo $VALUES | jq ".token" | sed "s/\"//g")
USER2_ACCNUM=$(echo $VALUES | jq ".accountNumber" | sed "s/\"//g")
echo
echo "User2 token is $USER2_TOKEN"
echo "User2 Account Number is $USER2_ACCNUM"

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
echo "POST request newAdmin Login  ..."
tput sgr 0
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/login \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=newAdmin&password=newadminpass')
echo $VALUES
NEW_ADMIN_TOKEN=$(echo $VALUES | jq ".token" | sed "s/\"//g")
NEW_ADMIN_ACCNUM=$(echo $VALUES | jq ".accountNumber" | sed "s/\"//g")
echo
echo "User2 token is $NEW_ADMIN_TOKEN"
echo "User2 Account Number is $NEW_ADMIN_ACCNUM"

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
echo "POST newAdmin confirm user3"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/ConfirmUser \
  -H "authorization: Bearer $NEW_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"username\":\"user3\",
  \"isConfirmed\":\"true\"
}")
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
echo "POST request USER3 Login  ..."
tput sgr 0
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/general/login \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=user3&password=user3pass')
echo $VALUES
USER3_TOKEN=$(echo $VALUES | jq ".token" | sed "s/\"//g")
USER3_ACCNUM=$(echo $VALUES | jq ".accountNumber" | sed "s/\"//g")
echo
echo "User2 token is $USER2_TOKEN"
echo "User2 Account Number is $USER2_ACCNUM"

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


##------------------------ TEST TRANSACTION API -----------------

tput setaf 6
echo "POST Admin Isuue 500 SMPS for User 1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/IssueForUser \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"accountNumber\":\"$USER1_ACCNUM\",
  \"amount\":\"500\"
}")
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
echo "POST Admin Get balance of User 1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/getBalance \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"accountNumber\":\"$USER1_ACCNUM\"
}")
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
echo "POST New Admin Isuue 800 SMPS for User 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/IssueForUser \
  -H "authorization: Bearer $NEW_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"accountNumber\":\"$USER2_ACCNUM\",
  \"amount\":\"800\"
}")
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
echo "POST New Admin Get balance of User 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/getBalance \
  -H "authorization: Bearer $NEW_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"accountNumber\":\"$USER2_ACCNUM\"
}")
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
echo "POST Admin Isuue 400 SMPS for User 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/IssueForUser \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"accountNumber\":\"$USER2_ACCNUM\",
  \"amount\":\"400\"
}")
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
echo "POST Admin Get balance of User 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/getBalance \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"accountNumber\":\"$USER2_ACCNUM\"
}")
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
echo "POST User 2 transfer 200 SMPS to User 1"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/transfer \
  -H "authorization: Bearer $USER2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"receiver\":\"$USER1_ACCNUM\",
  \"amount\":\"200\"
}")
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
echo "POST User 1 transfer 50 SMPS to User 2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/transfer \
  -H "authorization: Bearer $USER1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"receiver\":\"$USER2_ACCNUM\",
  \"amount\":\"50\"
}")
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
echo "POST User 1 GET BALANCE"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/getBalance \
  -H "authorization: Bearer $USER1_TOKEN" \
  -H "content-type: application/json" \
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
echo "POST User 2 GET BALANCE"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/getBalance \
  -H "authorization: Bearer $USER2_TOKEN" \
  -H "content-type: application/json" \
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



##-------------------------- TEST ASSET API -----------------------

tput setaf 6
echo "POST request USER1 REQUEST 2 ASSET  ..."
tput sgr 0

VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/requestAssets \
  -H "authorization: Bearer $USER1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"assetsCount\":\"2\",
  \"isMicroRequested\":\"false\"
}")
echo $VALUES
USER1_REQUEST_ID=$(echo $VALUES | jq ".requestId" | sed "s/\"//g")
echo
echo "User1 requestID is $USER1_REQUEST_ID"

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
echo "POST request ADMIN CONFIRM ASSET REQUEST  ..."
tput sgr 0

VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/ConfirmAndAddAssets \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"requestId\":\"$USER1_REQUEST_ID\",
  \"confirmAssetCount\":\"2\"
}")
echo $VALUES
USER1_ASSET_ID=$(echo $VALUES | jq ".assets[0]" | sed "s/\"//g")
echo
echo "User1 ASSETID is $USER1_ASSET_ID"

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
echo "POST User 1 Confirm Asset"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/confirmAsset \
  -H "authorization: Bearer $USER1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"serialNumber\":\"$USER1_ASSET_ID\",
  \"assetType\":\"type1\",
  \"assetVar\":\"var1\"
}")
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
echo "POST request USER3 REQUEST 2 ASSET  ..."
tput sgr 0

VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/requestAssets \
  -H "authorization: Bearer $USER3_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"assetsCount\":\"2\",
  \"isMicroRequested\":\"true\"
}")
echo $VALUES
USER3_REQUEST_ID=$(echo $VALUES | jq ".requestId" | sed "s/\"//g")
echo
echo "USER3 requestID is $USER3_REQUEST_ID"

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
echo "POST request ADMIN CONFIRM ASSET REQUEST  ..."
tput sgr 0

VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/admin/ConfirmAndAddAssets \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"requestId\":\"$USER3_REQUEST_ID\",
  \"confirmAssetCount\":\"2\",
  \"microId\" : [\"user3_micro$(date +%s)\" , \"user3_micro02$(date +%s)\"]
}")
echo $VALUES
USER3_ASSET_ID=$(echo $VALUES | jq ".assets[0]" | sed "s/\"//g")
echo
echo "USER3 ASSETID is $USER3_ASSET_ID"

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
echo "POST User 3 Confirm Asset"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/confirmAsset \
  -H "authorization: Bearer $USER3_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"serialNumber\":\"$USER3_ASSET_ID\",
  \"assetType\":\"type3\",
  \"assetVar\":\"var3\"
}")
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
echo "POST User 1 CHANGE HOLDER OF Asset to USER2"
tput sgr 0
echo
VALUES=$(curl -s -X POST \
  http://localhost:$ServerPort/api/user/changeHolder \
  -H "authorization: Bearer $USER1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"serialNumber\":\"$USER1_ASSET_ID\",
  \"newHolder\":\"$USER2_ACCNUM\"
}")
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




# echo "GET query chaincode on peer1 of Org1"
# echo
# curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/channels/mychannel/chaincodes/mycc?peer=peer0.org1.iranscm.tkfcn=query&args=%5B%22a%22%5D" \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json"
# echo
# echo

# echo "GET query Block by blockNumber"
# echo
# BLOCK_INFO=$(curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/channels/mychannel/blocks/1?peer=peer0.org1.iranscm.tk \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json")
# echo $BLOCK_INFO
# # Assign previous block hash to HASH
# HASH=$(echo $BLOCK_INFO | jq -r ".header.previous_hash")
# echo

# echo "GET query Transaction by TransactionID"
# echo
# curl -s -X GET http://localhost:$ServerPort/api/general/channels/mychannel/transactions/$TRX_ID?peer=peer0.org1.iranscm.tk\
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json"
# echo
# echo


# echo "GET query Block by Hash - Hash is $HASH"
# echo
# curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/channels/mychannel/blocks?hash=$HASH&peer=peer0.org1.iranscm.tk \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "cache-control: no-cache" \
  # -H "content-type: application/json" \
  # -H "x-access-token: $ORG1_TOKEN"
# echo
# echo

# echo "GET query ChainInfo"
# echo
# curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/channels/mychannel?peer=peer0.org1.iranscm.tk \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json"
# echo
# echo

# echo "GET query Installed chaincodes"
# echo
# curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/chaincodes?peer=peer0.org1.iranscm.tk \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json"
# echo
# echo

# echo "GET query Instantiated chaincodes"
# echo
# curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/channels/mychannel/chaincodes?peer=peer0.org1.iranscm.tk \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json"
# echo
# echo

# echo "GET query Channels"
# echo
# curl -s -X GET \
  # "http://localhost:$ServerPort/api/general/channels?peer=peer0.org1.iranscm.tk \
  # -H "authorization: Bearer $ORG1_TOKEN" \
  # -H "content-type: application/json"
# echo
# echo


# echo "Total execution time : $(($(date +%s)-starttime)) secs ..."



END_TIME=$(date +%s)
DURATION=$(($END_TIME - $START_TIME))

echo
echo
echo

tput setaf 6
echo '============================================================='
echo '========================== RESULT ==========================='
echo '============================================================='
tput sgr 0

echo
echo

echo "----------- DURATION $DURATION ---------------------"
echo

tput setaf 7
echo "----------- TEST COUNT $TEST_COUNT"
tput sgr 0

tput setaf 2
echo "----------- SUCCESS COUNT $SUCCESS_COUNT"
tput sgr 0

tput setaf 1
echo "----------- ERROR COUNT $ERROR_COUNT"
tput sgr 0

tput setaf 3
echo "----------- WARRNING COUNT $WARNING_COUNT"
tput sgr 0
