
# TODO LIST

### 1) AttachEvent

I fixed the port by setting auxRemote = 3051.
Then I call [11_01-attach-event.js](test%2Fmr%2F11_01-attach-event.js)
The first time I do so, it works as expected. 
https://github.com/FirebirdSQL/firebird/blob/3496c5d2c79f1126ede56c0077d49a6ae3b2ae42/src/remote/server/server.cpp#L2626

### 2) Support other encodings

I started integrating a feature from node-firebird main repo but realize that the code from there has suffered many modifications. 
The encoding property is for that reason, untested and may not work as expected.

What needs to be done? - Test the parsing strategy. 
Currently, DEFAULT_ENCODING constant is injected, on the other hand, at node-firebird repo no value is specified as argument. 

ret = data.readString(DEFAULT_ENCODING)


### 3) Add support + testing for other isolation strategies 


Firebird documentation points the three options supported by the DBMS:
- `READ COMMITTED` 
- `SNAPSHOT`
- `SNAPSHOT TABLE STABILITY`

I've been using this lib with `READ COMMITED` but noticed that some constants were available to activate some `SNAPSHOT TABLE STABILITY` 

For more information on this subject I'll leave here the link to the documentation where each of these options is well documented and explained.
https://firebirdsql.org/file/documentation/chunk/en/refdocs/fblangref30/fblangref30-transacs.html


```
ISOLATION_REPEATABLE_READ = 
    [ISC_TPB.version3, ISC_TPB.write, ISC_TPB.wait, ISC_TPB.concurrency, null],
ISOLATION_SERIALIZABLE = 
    [ISC_TPB.version3, ISC_TPB.write, ISC_TPB.wait, ISC_TPB.consistency , null],
```


