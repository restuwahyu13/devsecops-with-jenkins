# DevSecOps With Jenkins

Tutorial ini adalah lanjutan dari [automation with jenkins](https://github.com/restuwahyu13/automation-with-jenkins), yang dimana disini saya menambahkan step implementation security analysis menggunakan sonarQube dan Trivy, yang berguna untuk mendekteksi bugs, code smell, security issue etc.

## Step By Step

1. Pastikan anda sudah meginstall SonarQube di server 2 dan sonarScanner di server 1
2. Setelah selesai menginstall sonarQube dan sonarScanner, anda juga harus meginstall Trivy di server 1
3. Untuk instalasi lainnya silahkan cek [disini](https://github.com/restuwahyu13/automation-with-jenkins)

## Install SonarQube

```sh
docker network create sonar_network

docker run -d --name postgres-14 \
  -e POSTGRES_USER=restuwahyu13 \
  -e POSTGRES_PASSWORD=restuwahyu13 \
  -v postgresql:/var/lib/postgresql \
  -v postgresql_data:/var/lib/postgresql/data \
  --network sonar_network \
  --restart=always \
  postgres:14-alpine

docker run -d --name sonarqube-lts-community \
  -p 9000:9000 \
  -e SONAR_JDBC_URL=jdbc:postgresql://<ip docker container postgres>:5432/postgres \
  -e SONAR_JDBC_USERNAME=restuwahyu13 \
  -e SONAR_JDBC_PASSWORD=restuwahyu13 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  --network sonar_network \
  --link postgres-14 \
  sonarqube:lts-community
```

## Install Sonar Scanner

```sh
sudo apt install java-17-openjdk
ls -la /usr/jvm/java-17-openjdk
sudo vim ~/.bashrc -> export JAVA_HOME="/usr/jvm/java-17-openjdk"
source ~/.bashrc
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.0.2966-linux.zip
sudo apt-get install unzip
unzip sonar-scanner-cli-5.0.0.2966-linux.zip && rm -rf sonar-scanner-cli-5.0.0.2966-linux.zip
sudo mv sonar-scanner-cli-5.0.0.2966-linux /opt
sudo chmod +x /opt/sonar-scanner-5.0.0.2966-linux/bin/sonar-scanner
sudo ln -s /opt/sonar-scanner-5.0.0.2966-linux/bin/sonar-scanner /usr/bin
```

## Install Trivy

```sh
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```
