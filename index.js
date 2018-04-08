const ele = require('./lib/ele');
// const meituan = require('./lib/meituan')

let main = async function() {
    await ele();
};

main();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});


// console.log('this is test for rebase')