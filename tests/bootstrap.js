process.on('unhandledRejection', (reason, p) => {
  console.log('unhandled promise rejection', JSON.stringify(reason));
  console.log(JSON.stringify(p));
});
