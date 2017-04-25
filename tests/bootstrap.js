process.on('unhandledRejection', (reason, p) => {
  console.log(JSON.stringify(reason));
  console.log(JSON.stringify(p));
});
