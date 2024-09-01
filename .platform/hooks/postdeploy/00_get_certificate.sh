#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d <url> --nginx --agree-tos --email <email>
