#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d smumh-group1-3.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email bzv27@byu.edu