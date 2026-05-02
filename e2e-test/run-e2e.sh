#!/bin/sh

set -e

# Alpine images do not have curl
apk --no-cache add curl

while [[ "$(curl --connect-timeout 2 -s -o /dev/null -w ''%{http_code}'' $HOST)" != "200" ]];
  do echo 'Application has not started...';
  sleep 2;
done;
echo 'Application is running';

npm run test:e2e:local
