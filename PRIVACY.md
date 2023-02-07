# Privacy Policy
## Collected data
Ticket Golem collects very little of your data. In order to function, these are the things that are collected and stored indefinitely:
- Anything you provide to the bot through commands. This primarily includes ticket names, descriptions, and starter messages
- Discord-provided server, user, and channel IDs, as part of management for configuration, permissions, and channel IDs 
- Daily backups of the above

## Storage and access
Data is stored using PostgreSQL on a secure and private server. The data is only accessible by the developers of the bot; no one else has been given access.

## Usage
Data collected by the bot is used in a few ways:
### Server IDs
Server IDs are used to differentiate tickets across servers and store server-specific configuration.

### User IDs
User IDs are used to manage permissions on tickets, so that permissions can be automatically given and revoked on tickets.

### Message IDs
Message IDs- not content- are stored to keep track of which messages are important to the bot, like ticket openers and first messages.

### Text provided through commands
Some data may be stored through commands, such as information relating to tickets. This is used to easily display this information, or to set configuration options.

## Note: Message content is NOT stored

Message content, outside of when commands are used, is *never* stored in the bot. Nothing sent in tickets is stored; when archiving a ticket, that data is gathered from Discord's API and turned into a readable format, without that data ever being permananently saved.

## Removing data
Most data can easily be deleted by using the proper command to delete it. Note that this will not remove data from any existing backups of it, and that it is still possible to lose access to some data by leaving servers or removing the bot from your server.  
If you would like inaccessible data deleted, feel free to contact us using the information below.

## Contact
If desired, you can contact us at (GS)#6969 on Discord or [join the support server](https://discord.gg/EvDmXGt) to ask us to remove any other data. This is also where we can be contacted about privacy concerns if necessary.