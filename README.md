# Pocket - Archive All

I've been trying to switch from Instapaper to Pocket, but all my Instapaper items have been imported as unread items... So I had more than thousands unread items and it was not possible to archive everything. I could have used the "bulk edit" feature but it would have taken ages to select all those articles...

## Install your instance

First of all, you'll need to get a consumer key for the pocket api. http://getpocket.com/developer/apps/new

## Development
```bash
$ echo "exports POCKET_CONSUMER_SECRET=YOUR_CONSUMER_SECRET" > .env
$ ./dev-server
```