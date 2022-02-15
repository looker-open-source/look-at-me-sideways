FROM openjdk:8-jdk-alpine

RUN apk add --no-cache git openssh-client curl unzip bash jq ttf-dejavu coreutils tini nodejs nodejs-npm

ARG user=jenkins
ARG group=jenkins
ARG uid=1000
ARG gid=1000
ARG http_port=8080
ARG agent_port=50000
ARG JENKINS_HOME=/var/jenkins_home

ENV JENKINS_HOME $JENKINS_HOME
ENV JENKINS_SLAVE_AGENT_PORT ${agent_port}

# Privacy policy parameters - REQUIRED!
ARG default_reporting=no
ENV reporting=$default_reporting

ARG default_license_key=""
ENV license_key=$default_license_key

ARG default_reporting_user=""
ENV reporting_user=$default_reporting_user

# Jenkins is run with user `jenkins`, uid = 1000
# If you bind mount a volume from the host or a data container,
# ensure you use the same uid
RUN addgroup -S -g ${gid} ${group} \
  && adduser -h ${JENKINS_HOME} -G ${group} -D -u ${uid} -s bin/sh ${user}

# `/usr/share/jenkins/ref/` contains all reference configuration we want
# to set on a fresh new installation. Use it to bundle additional plugins
# or config file with your custom jenkins Docker image.
RUN mkdir -p /usr/share/jenkins/ref/init.groovy.d
COPY --chown=jenkins:jenkins init.groovy /usr/share/jenkins/ref/init.groovy.d/tcp-slave-agent-port.groovy

# jenkins version being bundled in this docker image
ARG JENKINS_VERSION
ENV JENKINS_VERSION ${JENKINS_VERSION:-2.138.4}
 
# jenkins.war checksum, download will be validated using it
ARG JENKINS_SHA=053d2941d558092c934a0f95798ff2177170eecfffab27a46e30744cf12bc3da

# Can be used to customize where jenkins.war get downloaded from
ARG JENKINS_URL=https://repo.jenkins-ci.org/public/org/jenkins-ci/main/jenkins-war/${JENKINS_VERSION}/jenkins-war-${JENKINS_VERSION}.war

# Download Jenkins and verify it
RUN curl -fsSL ${JENKINS_URL} -o /usr/share/jenkins/jenkins.war \
  && echo "${JENKINS_SHA}  /usr/share/jenkins/jenkins.war" | sha256sum -c -

ENV JENKINS_UC https://updates.jenkins.io
ENV JENKINS_UC_EXPERIMENTAL=https://updates.jenkins.io/experimental
ENV JENKINS_INCREMENTALS_REPO_MIRROR=https://repo.jenkins-ci.org/incrementals

# for main web interface:
EXPOSE ${http_port}

# will be used by attached slave agents:
EXPOSE ${agent_port}

ENV COPY_REFERENCE_FILE_LOG $JENKINS_HOME/copy_reference_file.log

# Add the admin user  
 COPY --chown=jenkins:jenkins /configs/users "$JENKINS_HOME"/users/

# Add the main, CLI and global config files to the jenkins path  
COPY --chown=jenkins:jenkins /configs/jenkins_home_config.xml "$JENKINS_HOME"/config.xml
COPY --chown=jenkins:jenkins /configs/jenkins.model.JenkinsLocationConfiguration.xml "$JENKINS_HOME"/jenkins.model.JenkinsLocationConfiguration.xml
COPY --chown=jenkins:jenkins /configs/jenkins.CLI.xml "$JENKINS_HOME"/jenkins.CLI.xml
COPY --chown=jenkins:jenkins /configs/jenkins.security.apitoken.ApiTokenPropertyConfiguration.xml "$JENKINS_HOME"/jenkins.security.apitoken.ApiTokenPropertyConfiguration.xml

# Create Job
# Name the jobs  
ARG job_name_1="look_at_me_sideways"

# Create the job workspaces  
RUN mkdir -p "$JENKINS_HOME"/workspace/${job_name_1}

# Create the jobs folder recursively  
RUN mkdir -p "$JENKINS_HOME"/jobs/${job_name_1}

# Add the custom configs to the container  
COPY --chown=jenkins:jenkins /configs/${job_name_1}_config.xml "$JENKINS_HOME"/jobs/${job_name_1}/config.xml

# Create build file structure  
RUN mkdir -p "$JENKINS_HOME"/jobs/${job_name_1}/latest/  
# RUN mkdir -p "$JENKINS_HOME"/jobs/${job_name_1}/builds/1/

# Add all necessary scripts
COPY --chown=jenkins:jenkins jenkins-support /usr/local/bin/jenkins-support
COPY --chown=jenkins:jenkins jenkins.sh /usr/local/bin/jenkins.sh
COPY --chown=jenkins:jenkins set-commit-status.sh /usr/local/bin/set-commit-status.sh
COPY --chown=jenkins:jenkins tini-shim.sh /bin/tini
COPY --chown=jenkins:jenkins install-plugins.sh /usr/local/bin/install-plugins.sh

# Install plugins
RUN \
  ATTEMPTS=3 \ 
  /usr/local/bin/install-plugins.sh \
  generic-webhook-trigger:1.50 \
  github:1.29.3 \
  postbuild-task:1.8

# chown and chmod to jenkins user
RUN chown -R ${user} $JENKINS_HOME && chown -R ${user} /usr/share/jenkins/ref
RUN chgrp -R ${group} $JENKINS_HOME && chgrp -R ${group} /usr/share/jenkins/ref

# Temporarily solution: Install LAMS as a global package from the repo
# It would be better to install from NPM and specify a major (or exact) version
RUN git clone https://github.com/looker-open-source/look-at-me-sideways.git /usr/local/bin/lams
RUN cd /usr/local/bin/lams \
    &&  npm config set unsafe-perm true \
    && npm install --global --production \
    && npm config set unsafe-perm false
RUN chown -R ${user} /usr/local/bin/lams && chgrp -R ${group} /usr/local/bin/lams

USER ${user}
RUN git config --global user.name "Jenkins"
RUN git config --global user.email "lams@host.com"

# Jenkins home directory is a volume, so configuration and build history
# can be persisted and survive image upgrades
VOLUME $JENKINS_HOME

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/jenkins.sh"]
