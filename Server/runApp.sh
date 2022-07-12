#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

function dkcl(){
        CONTAINER_IDS=$(docker ps -aq)
	echo
        if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
                echo "========== No containers available for deletion =========="
        else
                docker rm -f $CONTAINER_IDS
        fi
	echo
}

function dkrm(){
        DOCKER_IMAGE_IDS=$(docker images | grep "dev\|none\|test-vp\|peer[0-9]-" | awk '{print $3}')
	echo
        if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" = " " ]; then
		echo "========== No images available for deletion ==========="
        else
                docker rmi -f $DOCKER_IMAGE_IDS
        fi
	echo
}

function restartNetwork() {
	echo
	
	SCMAPP=$(docker images |grep scmapp) ;
	if [ -z "$SCMAPP" ]; then
		echo "========== scmapp isn't available ==========="
		(
		echo "----------- building scmapp ... --------------"
		
		docker build -t scmapp .
		)
        else
                echo "----------- scmapp exist ------------"
        fi
	echo

  #teardown the network and clean the containers and intermediate images
	
	dkcl
	dkrm
	docker-compose -f ./artifacts/docker-compose-org1.yaml -f ./artifacts/docker-compose-org1-couchDB.yaml down -v
	docker-compose -f ./artifacts/docker-compose-org2.yaml -f ./artifacts/docker-compose-org2-couchDB.yaml down -v
	docker-compose -f ./artifacts/docker-compose-app.yaml down -v
	
	#Cleanup the stores
	rm -rf ./artifacts/fabricClientKeyValue/*

	#Start the network
	docker-compose -f ./artifacts/docker-compose-org1.yaml -f ./artifacts/docker-compose-org1-couchDB.yaml up -d
	docker-compose -f ./artifacts/docker-compose-org2.yaml -f ./artifacts/docker-compose-org2-couchDB.yaml up -d
	docker-compose -f ./artifacts/docker-compose-app.yaml up -d
	echo
}

function dbConstruct() {
	docker exec -it app.spsmOrg.com node ./initUserDataBase.js drop
	docker exec -it app.spsmOrg.com node ./initUserDataBase.js create
	docker exec -it app.spsmOrg.com node ./initUserDataBase.js admin 1
	docker exec -it app.spsmOrg.com node RegisterAdmin.js Admin1 Org1 1111111111
  #remove next line later
	docker exec -it app.spsmOrg.com node ./initUserDataBase.js admin 2
	docker exec -it app.spsmOrg.com node RegisterAdmin.js Admin2 Org2 2222222222

	docker exec -it app.spsmOrg.com node ./initAssetDataBase.js drop_ra
	docker exec -it app.spsmOrg.com node ./initAssetDataBase.js create_ra

	docker exec -it app.spsmOrg.com node ./initAssetDataBase.js drop_a
	docker exec -it app.spsmOrg.com node ./initAssetDataBase.js create_a


}



restartNetwork
sleep 10
dbConstruct

 # node app.js
echo
echo
echo "--------------- PLEASE WAIT  , INITIATING NETWORK...  ------------------------"
echo 
echo

sleep 5


./initNetwork.sh

sleep 2 

echo "--------------- PLEASE WAIT  , TRY TO RUN BLOCKCHAIN EXPLORER  ------------------------"

docker-compose -f ./artifacts/docker-compose-blockchain-explorer.yaml down -v 
docker-compose -f ./artifacts/docker-compose-blockchain-explorer.yaml up -d

docker-compose -f ./artifacts/docker-compose-prometheus-grafana.yaml down -v 
docker-compose -f ./artifacts/docker-compose-prometheus-grafana.yaml up -d
