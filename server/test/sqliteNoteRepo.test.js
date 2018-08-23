const Repo = require('../src/sqliteNoteRepo');
const RepoStub = require('./inMemoryRepo');

describe('Test SqLite3 note repository', () => {
  test('Creates in memory db', () => {
    let repo = undefined;
    try {
      repo = new Repo();
      expect(repo).not.toBeUndefined();
    } finally {
      if (repo) {
        repo.close();
      }
    }
  });

  test('Creates and retrieves notes', () => {
    const repo = new Repo();
    const user = 1;
    const content = 'Hello, World!';

    return repo.setup().
      then(() => repo.createNote(content, user)).
      then(id => repo.getNote(id, user)).
      then(result => expect(result).toEqual(content)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Creates and retrieves users', () => {
    const repo = new Repo();
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    var userId = -1;

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => userId = id).
      then(() => repo.getUser(userName)).
      then(result => expect(result).toEqual(userId)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Has method implementations', () => {
    const repo = new Repo();
    RepoStub.checkMethodNames(repo);
  });
});
