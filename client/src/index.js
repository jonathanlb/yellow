const App = require('./app');

const opts = {
  contentSelector: 'main-app',
  serverPrefix: 'http://localhost:3000/',
};
const app = new App(opts);
app.setup()
  .then(() => app.render());
