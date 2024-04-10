
1) Conceptually a connection can have more than 1 active transaction
although this lib has some limitations such as the fact that the "latest" isolation level is stored at connection level.
 ```
    // from original transaction referece 
    tx.connection._isolation
```



2) AttachEvent

I fixed the port by setting auxRemote = 3051.
Then I call [11_01-attach-event.js](test%2Fmr%2F11_01-attach-event.js)
The first time I do so, it works as expected. 
https://github.com/FirebirdSQL/firebird/blob/3496c5d2c79f1126ede56c0077d49a6ae3b2ae42/src/remote/server/server.cpp#L2626

3) Encoding
I started integrating a feature from node-firebird main repo but realize that the code from there has suffered many modifications. 
The encoding property is for that reason, untested and may not work as expected.

What needs to be done? - Test the parsing strategy. 
Currently, DEFAULT_ENCODING constant is injected, on the other hand, at node-firebird repo no value is specified as argument. 

ret = data.readString(DEFAULT_ENCODING)

