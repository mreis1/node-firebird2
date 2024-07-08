const fb = require("../../../lib");
const {DROPTABLE, F_SQLSTM} = require("./queries");
const {logFb} = require("./log-fb-err");
exports.prepareTestStructure = async function(config) {
    return new Promise((resolve, reject) => {
        fb.promises.attach(config)
            .then(async (con) => {
                const tx = await con.transaction(fb.ISOLATION_READ_COMMITED);

                /**
                 * Prepare execution environment by creating DROPTABLE procedure if not available
                 * @type {string}
                 */
                let query = DROPTABLE;
                await tx.query(query);
                // await tx.commitRetaining();

                query = F_SQLSTM;
                console.log(query)
                await tx.query(query);

                try {
                    query = 'EXECUTE BLOCK AS BEGIN ' +
                        `\n EXECUTE STATEMENT 'EXECUTE PROCEDURE DROPTABLE(''XTEST2'', -1)' ;`+
                        `\n EXECUTE STATEMENT 'EXECUTE PROCEDURE DROPTABLE(''XTEST'',  -1)';`+
                        `\n EXECUTE STATEMENT 'CREATE TABLE XTEST(XTL_ID BIGINT NOT NULL, XTL_VALUE DOM_CHAINE_20_NULL)';` +
                        `\n EXECUTE STATEMENT 'CREATE TABLE XTEST2(XTL2_ID BIGINT NOT NULL, XTL2_IDXTL BIGINT)';` +
                        `\n EXECUTE STATEMENT 'ALTER  TABLE XTEST  ADD CONSTRAINT PK_XTL_ID PRIMARY KEY (XTL_ID )';` +
                        `\n EXECUTE STATEMENT 'ALTER  TABLE XTEST2 ADD CONSTRAINT PK_XTL2_ID PRIMARY KEY (XTL2_ID)';` +
                        `\n EXECUTE STATEMENT 'ALTER  TABLE XTEST2 ADD CONSTRAINT FK_XTL2_IDXTL FOREIGN KEY (XTL2_IDXTL) REFERENCES XTEST (XTL_ID) ON DELETE CASCADE ON UPDATE CASCADE';` +
                        '\nEND';
                    console.log(query)
                    await tx.query(query)
                    console.log('TBl created \n\n' + query);
                } catch (err) {
                    // 335544351 unsuccessful metadata update, CREATE TABLE TEST failed, Table TEST already exists, At block line: 1, col: 24
                    logFb(err)
                }
                // await tx.commitRetaining();
                await tx.commit()

                await con.detach();
                resolve();
            }).catch(reject)
    })
}
