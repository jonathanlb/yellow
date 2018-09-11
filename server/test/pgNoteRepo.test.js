const Repo = require('../src/pgNoteRepo');
const RepoStub = require('./inMemoryNoteRepo');

describe('Test Postgres note repository', () => {

  test('Has method implementations', () => {
    const repo = new Repo();
    RepoStub.checkMethodNames(repo);
  });
});
