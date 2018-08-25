const App = require('./app');

const opts = {
  contentSelector: 'main-app',
  serverPrefix: 'localhost:3000/',
};
const app = new App(opts);
app.setup()
  .then(() => app.render());
