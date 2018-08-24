const App = require('./app');

const app = new App('main-app');
app.setup()
  .then(() => app.render());
