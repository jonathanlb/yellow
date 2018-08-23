const Repo = require('../src/sqliteNoteRepo');
const RepoStub = require('./inMemoryNoteRepo');

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

  test('Deletes notes', () => {
    const repo = new Repo();
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    var userId = -1;
    var noteId = -1;
    const content = 'Hello, World!';

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => userId = id).
      then(() => repo.createNote(content, userId)).
      then(id => noteId = id).
      then(id => repo.removeNote(noteId, userId)).
      then(id => repo.getNote(noteId, userId)).
      then(result => expect(result).toBeUndefined()).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Searches notes', () => {
    const repo = new Repo();
    const userId = 1;

    return repo.setup().
      then(() => repo.createNote('foo', userId)).
      then(() => repo.createNote('bar', userId)).
      then(() => repo.createNote('baz', userId)).
      then(() => repo.searchNote('content LIKE \'%b%\'', userId)).
      then(result => expect(result).toEqual([2,3])).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Uses secrets', () => {
    const repo = new Repo();
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    var userId = -1;

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => userId = id).
      then(() => repo.checkSecret(secret, userId)).
      then(result => expect(result, 'expected secretCheck OK').toBe(true)).
      then(() => repo.checkSecret(secret + 'foo', userId)).
      then(result => expect(result, 'expected secretCheck to fail from bad secret').toBe(false)).
      then(() => repo.checkSecret(secret, userId + 1)).
      then(result => expect(result, 'expected secretCheck to fail from bad id').toBe(false)).
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
