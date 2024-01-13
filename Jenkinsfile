pipeline {
  agent any

  environment {
    GITLAB_REGISTRY_URL = 'registry.gitlab.com'
    GITLAB_REPOSITORY_NAME = 'restuwahyu13/devsecops-with-jenkins' // change with your repository name
    DOCKER_COMPOSE_ORG_FILE = './devsecops-with-jenkins/docker-compose.yml'
    DOCKER_COMPOSE_PROD_FILE = './devsecops-with-jenkins/docker-compose.prod.yml'
    SLACK_CHANNELID = 'C06C4233F4L' // change with your slack channelid
    SLACK_MSG_SUCCESS = 'Your pipeline is running well'
    SLACK_MSG_FAILED = 'Your pipeline is not running well'
    SONAR_TYPE = 'vuln misconfig license secret'
    SONAR_SEVERITY = 'LOW,MEDIUM,HIGH,CRITICAL'
    SSH_HOST = '192.168.64.10' // change with your ssh ip address
    DIRECTORY = './devsecops-with-jenkins'
  }

  options {
    disableConcurrentBuilds()
    timestamps()
    quietPeriod(5)
    retry(3)
    timeout(time: 30, unit: 'MINUTES')
    durabilityHint('PERFORMANCE_OPTIMIZED')
  }

  stages {
    stage('Clone Repository') {
      steps {
        git(branch: 'main', url: "https://gitlab.com/${GITLAB_REPOSITORY_NAME}", credentialsId: 'gitlab_credentials_id')
      }
    }

    stage('Quality Control') {
      steps {
        sh '''#!/bin/bash
        test=$(npm test | awk '/passing/ {print $2}')

        if [[ "${test}" -ne 'passing' ]]; then
            exit 1
        else
            npm install && npm run cov
        fi
        '''
      }
    }

    stage('Security Code Analysis') {
      steps {
        sh 'sonar-scanner -Dsonar.projectSettings=./sonar-project.properties'
      }
    }

    stage('Security File Analysis') {
      steps {
        sh '''#!/bin/bash
          types=(${SONAR_TYPE})
          severity=${SONAR_SEVERITY}

          for ((i = 0; i < "${#types[@]}"; i++));
          do
            type="${types[$i]}"
            scan=$(trivy fs --no-progress --scanners "$type" --severity "$severity" --parallel 10 --exit-code 1 . | awk '/Failures:/ { print $2 }')

            if [[ "$scan" -ne '' ]]; then
              trivy fs --skip-db-update --scanners "$type" --severity "$severity" --parallel 10 --exit-code 1 .

              echo "
              =================================
                  FS REPORT ANALYSIS
              =================================

                  $type detected : $scan

              =================================
              "

              sleep 3
              exit 1
            else
              echo "
              =================================
                  FS REPORT ANALYSIS
              =================================

                  $type no detected : 0

              =================================
              "
            fi
          done
        '''
      }
    }

    stage('Build image') {
      steps {
        withCredentials([usernamePassword(usernameVariable: 'GITLAB_USERNAME', passwordVariable: 'GITLAB_PASSWORD', credentialsId: 'gitlab_credentials_id')]) {
          script {
            def buildNumber = Integer.parseInt("$BUILD_NUMBER")
            def previousBuildNumber = buildNumber

            if (buildNumber >= 1) {
              previousBuildNumber = buildNumber - 1
            }

            sh """
              docker login --username ${GITLAB_USERNAME} --password ${GITLAB_PASSWORD} ${GITLAB_REGISTRY_URL}
              docker rmi ${previousBuildNumber} -f
              docker build -t ${GITLAB_REGISTRY_URL}/${GITLAB_REPOSITORY_NAME}:v${BUILD_NUMBER} --compress .
              docker tag ${GITLAB_REGISTRY_URL}/${GITLAB_REPOSITORY_NAME}:latest
              docker push ${GITLAB_REGISTRY_URL}/${GITLAB_REPOSITORY_NAME}:v${BUILD_NUMBER}
            """
          }
        }
      }
    }

    stage('Security Image Analysis') {
      steps {
        sh '''#!/bin/bash
          types=(${SONAR_TYPE})
          severity=${SONAR_SEVERITY}

          for ((i = 0; i < "${#types[@]}"; i++));
          do
            type="${types[$i]}"
            scan=$(trivy image --no-progress --scanners "$type" --severity "$severity" --parallel 10 --exit-code 1 ${GITLAB_REGISTRY_URL}/${GITLAB_REPOSITORY_NAME}:latest | awk '/Failures:/ {print $2}')

            if [[ "$scan" -ne '' ]]; then
              trivy image --skip-db-update --scanners "$type" --severity "$severity" --parallel 10 --exit-code 1 ${GITLAB_REGISTRY_URL}/${GITLAB_REPOSITORY_NAME}:latest

              echo "
              =================================
                  IMAGE REPORT ANALYSIS
              =================================

                  $type detected : $scan

              =================================
              "

              sleep 3
              exit 1
            else
              docker rmi ${GITLAB_REGISTRY_URL}/${GITLAB_REPOSITORY_NAME} -f
              docker logout

              echo "
              =================================
                  IMAGE REPORT ANALYSIS
              =================================

                  $type no detected : 0

              =================================
              "
            fi
          done
        '''
      }
    }

    stage('App Release') {
      steps {
        withCredentials([
            usernamePassword(usernameVariable: 'SSH_USERNAME', passwordVariable: 'SSH_PASSWORD', credentialsId: 'ssh_credentials_id'),
            usernamePassword(usernameVariable: 'GITLAB_USERNAME', passwordVariable: 'GITLAB_PASSWORD', credentialsId: 'gitlab_credentials_token_id')
        ]) {
          script {
            def buildNumber = Integer.parseInt("$BUILD_NUMBER")
            def previousBuildNumber = buildNumber

            if (buildNumber >= 1) {
              previousBuildNumber = buildNumber - 1
            }

            def remoteServer = [:]
            remoteServer.name = env.SSH_USERNAME
            remoteServer.host = env.SSH_HOST
            remoteServer.user = env.SSH_USERNAME
            remoteServer.password = env.SSH_PASSWORD
            remoteServer.allowAnyHosts = true

            def commandServer = """
              docker login --username ${GITLAB_USERNAME} --password ${GITLAB_PASSWORD} ${GITLAB_REGISTRY_URL}

              if [ -f "${DOCKER_COMPOSE_PROD_FILE}" ]
                then
                  cat ${DOCKER_COMPOSE_PROD_FILE}
                else
                  git clone https://${GITLAB_USERNAME}:${GITLAB_PASSWORD}@gitlab.com/restuwahyu13/node-helloworld-api.git
                  touch ${DOCKER_COMPOSE_PROD_FILE}
              fi

              awk '{gsub(/:v1/, ":v${BUILD_NUMBER}"); print}' ${DOCKER_COMPOSE_ORG_FILE} > ${DOCKER_COMPOSE_PROD_FILE}
              docker-compose -f ${DOCKER_COMPOSE_PROD_FILE} up --pull missing --remove-orphans --force-recreate --wait -d

              docker rmi ${previousBuildNumber} -f
              docker logout

              rm -rf ${DIRECTORY}
            """

            sshCommand(remote: remoteServer, command: commandServer)
          }
        }
      }
    }
  }

  post {
    success {
      slackSend(
        channel: "$SLACK_CHANNELID",
        color: '#13d43a',
        message: "ID: $BUILD_NUMBER \n Name: $JOB_NAME \n Status: Success \n Message: $SLACK_MSG_SUCCESS \n Report: $BUILD_URL",
        sendAsText: true
      )
    }

    failure {
      slackSend(
        channel: "$SLACK_CHANNELID",
        color: '#ed0c35',
        message: "ID: $BUILD_NUMBER \n Name: $JOB_NAME \n Status: Failure \n Message: $SLACK_MSG_FAILED \n Report: $BUILD_URL",
        sendAsText: true
      )
    }

    aborted {
      slackSend(
        channel: "$SLACK_CHANNELID",
        color: '#f5ea16',
        message: "ID: $BUILD_NUMBER \n Name: $JOB_NAME \n Status: Aborted \n Message: $SLACK_MSG_FAILED \n Report: $BUILD_URL",
        sendAsText: true
      )
    }

    unstable {
      slackSend(
        channel: "$SLACK_CHANNELID",
        color: '#a3a39d',
        message: "ID: $BUILD_NUMBER \n Name: $JOB_NAME \n Status: Unstable \n Message: $SLACK_MSG_FAILED \n Report: $BUILD_URL",
        sendAsText: true
      )
    }
  }
}
