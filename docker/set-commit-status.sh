#!/bin/bash

# Get build status
RESULTS=$HOME/jobs/look_at_me_sideways/workspace/results.json
BUILD_STATUS=$(cat $RESULTS | jq '.buildStatus')

if [ "$BUILD_STATUS" = "\"PASSED\"" ]; then
  STATUS="success"
else
  STATUS="failure"
fi

# Build job url
CONSOLE=console
BUILD_URL=$BUILD_URL$CONSOLE

# Get number of warnings and errors
WARNINGS=$(cat $RESULTS | jq '.warnings')
ERRORS=$(cat $RESULTS | jq '.errors')
LAMS_ERRORS=$(cat $RESULTS | jq '.lamsErrors')

# Update commit statuses
echo "Setting commit status to ${STATUS}, with ${ERRORS} errors, ${WARNINGS} warnings and ${LAMS_ERRORS} tool errors."

curl "https://api.github.com/repos/${ACCOUNT_NAME}/${REPO_NAME}/statuses/$GIT_COMMIT?access_token=$GIT_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{\"state\": \"$STATUS\", \"description\": \"${ERRORS} errors, ${WARNINGS} warnings and ${LAMS_ERRORS} tool errors found.\", \"target_url\": \"$BUILD_URL\", \"context\":\"LAMS\"}"

LAST_COMMIT_SHA=$(git rev-parse HEAD)
curl "https://api.github.com/repos/${ACCOUNT_NAME}/${REPO_NAME}/statuses/$LAST_COMMIT_SHA?access_token=$GIT_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{\"state\": \"$STATUS\", \"description\": \"${ERRORS} errors, ${WARNINGS} warnings and ${LAMS_ERRORS} tool errors found.\", \"target_url\": \"$BUILD_URL\", \"context\":\"LAMS\"}"
