const App = require('./app');

const opts = {
  contentSelector: 'main-app',
  serverPrefix: App.getServerPrefix({}),
};
const app = new App(opts);
app.setup()
  .then(() => app.render());
