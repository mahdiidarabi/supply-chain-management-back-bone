#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

function dkcl(){
        CONTAINER_IDS=$(docker ps -a -f status=exited)
	echo
        if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
                echo "========== No containers stoped =========="
        else
                docker start -f $CONTAINER_IDS
        fi
	echo
}


function restartNetwork() {
	echo

  #teardown the network and clean the containers and intermediate images
	docker-compose -f ./artifacts/docker-compose.yaml up -d
	
	echo
}






restartNetwork


PORT=4000 node app
