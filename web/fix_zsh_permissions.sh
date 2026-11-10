#!/bin/bash

# Get the list of insecure files from compaudit
INSECURE_FILES=$(zsh -c "autoload -U compaudit && compaudit")

if [ -z "$INSECURE_FILES" ]; then
  echo "No insecure Zsh completion files found. You are good to go!"
else
  echo "Found the following insecure files/directories:"
  echo "$INSECURE_FILES"
  echo ""
  echo "Fixing permissions (removing write access for group and others)..."
  
  # Iterate over each file/directory and fix permissions
  # We use sudo because these files are often in system directories
  for file in $INSECURE_FILES; do
    if [ -e "$file" ]; then
      echo "Fixing: $file"
      sudo chown root:root "$file"
      sudo chmod g-w,o-w "$file"
    fi
  done
  
  echo ""
  echo "Permissions fixed. Please restart your shell or run 'exec zsh' to verify."
fi
