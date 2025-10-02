#!/bin/bash
cd /home/kavia/workspace/code-generation/tic-tac-toe-classic-146332-146360/tic_tac_toe_frontend
npx eslint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

