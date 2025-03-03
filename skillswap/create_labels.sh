#!/bin/bash

# Complexity labels
gh label create "complexity:beginner" --color "0E8A16" --description "Good for newcomers"
gh label create "complexity:intermediate" --color "FBCA04" --description "Requires some experience"
gh label create "complexity:advanced" --color "B60205" --description "Requires significant expertise"

# Skill labels
gh label create "skill:blockchain" --color "1D76DB" --description "Related to blockchain development"
gh label create "skill:smart-contracts" --color "0052CC" --description "Related to smart contract development"
gh label create "skill:frontend" --color "5319E7" --description "Related to frontend development"
gh label create "skill:backend" --color "006B75" --description "Related to backend development"
gh label create "skill:mobile" --color "0E8A16" --description "Related to mobile development"
gh label create "skill:documentation" --color "2A6EBB" --description "Related to documentation"
gh label create "skill:testing" --color "D93F0B" --description "Related to testing"

# Type labels
gh label create "feature" --color "0E8A16" --description "New feature or enhancement"
gh label create "bug" --color "B60205" --description "Something isn't working"
gh label create "documentation" --color "0075CA" --description "Documentation improvements"
gh label create "optimization" --color "D4C5F9" --description "Performance or code optimization"
gh label create "security" --color "B60205" --description "Security-related issues"

# Other labels
gh label create "good-first-issue" --color "7057FF" --description "Good issues for first-time contributors"
gh label create "help-wanted" --color "008672" --description "Extra attention is needed"
gh label create "priority-high" --color "B60205" --description "High priority issues"
gh label create "blocked" --color "B60205" --description "Blocked by other issues" 