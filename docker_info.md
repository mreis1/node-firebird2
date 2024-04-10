

## Setting up firebird to use events on a specific port 

```markdown
#
# The TCP Port Number to be used for server Event Notification
# messages.  The value of 0 (Zero) means that the server will choose
# a port number randomly.
#
# Per-connection configurable.
#
# Type: integer
#
RemoteAuxPort = 3051
```



## Restarting firebird:

``````
service firebird restart
```


```
docker run --name local_firebird3_test_db_1 \
-v /Users/marcio/DevEnv/Docker/local_firebird/data:/firebird/data \
-v /Users/marcio/DevEnv/Docker/local_firebird/log:/firebird/log \
-v /Users/marcio/DevEnv/Docker/local_firebird/etc:/firebird/etc \
-p 3050:3050 \
-p 3051:3051 \
-e "EnableLegacyClientAuth=true" \
-e "ISC_PASSWORD=sysdba_masterkey" \
-d 1f9b587ff018
```


## No network isolation for docker 

 Link: https://github.com/jacobalberty/firebird-docker/issues/24#issuecomment-382525800
```
docker run --name local_firebird3_test_db_net_host \
-v /Users/marcio/DevEnv/Docker/local_firebird/data:/firebird/data \
-v /Users/marcio/DevEnv/Docker/local_firebird/log:/firebird/log \
-v /Users/marcio/DevEnv/Docker/local_firebird/etc:/firebird/etc \
--net=host \
-e "EnableLegacyClientAuth=true" \
-e "ISC_PASSWORD=sysdba_masterkey" \
-d 1f9b587ff018
```
