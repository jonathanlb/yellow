const Repo = require('../src/sqliteNoteRepo');
const RepoStub = require('./inMemoryNoteRepo');

describe('Test SqLite3 note repository', () => {
  test('Creates in memory db', () => {
    let repo = undefined;
    try {
      repo = new Repo({});
      expect(repo).not.toBeUndefined();
    } finally {
      if (repo) {
        repo.close();
      }
    }
  });

  test('Creates and retrieves notes', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    let userId = -1;
    const content = 'Hello, World!';

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => userId = id).
      then(() => repo.createNote(content, userId)).
      then(id => repo.getNote(id, userId)).
      then(note => {
        expect(note.author).toBe(userId);
        expect(note.id).toBeDefined();
        expect(note.created).toBeDefined();
        expect(note.content).toEqual(content);
      }).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Creates and retrieves users', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    var userId = -1;

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => userId = id).
      then(() => repo.getUserId(userName)).
      then(result => expect(result).toEqual(userId)).
      then(() => repo.getUserName(userId)).
      then(result => expect(result).toEqual(userName)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Deletes notes', () => {
    const repo = new Repo({});
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

  test('Handles failed author conditions', () => {
    const repo = new Repo({});
    const userId = 1;

    return repo.setup().
      then(() => repo.createNote('foo', userId)).
      then(() => repo.createNote('bar', userId)).
      then(() => repo.createNote('baz', userId)).
      then(() => repo.searchNote('author: Jonathan %b%', userId)).
      then(result => expect(result).toEqual([])).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Handles failed user id lookup', () => {
    const repo = new Repo({});
    const userId = 1;

    return repo.setup().
      then(() => repo.getUserId('Bilbo Baggins')).
      then(result => expect(result).toBe(-1)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Searches notes', () => {
    const repo = new Repo({});
    let userId;

    return repo.setup().
      then(() => repo.createUser('Jonathan', 's3cr3T')).
      then(id => userId = id).
      then(() => repo.createNote('foo', userId)).
      then(() => repo.createNote('bar', userId)).
      then(() => repo.createNote('baz', userId)).
      then(() => repo.searchNote('%b%', userId)).
      then(result => expect(result).toEqual([3,2])).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Searches notes by author', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    let userId, otherUserId;

    return repo.setup().
      then(() => repo.createUser('Mattie', 'woof!')).
      then(id => otherUserId = id).
      then(() => repo.createUser(userName, 's3cr3T')).
      then(id => userId = id).
      then(() => repo.createNote('woof', otherUserId)).
      then(() => repo.createNote('hello', userId)).
      then(() => repo.createNote('sniff', otherUserId)).
      then(() => repo.createNote('todos', userId)).
      then(() => repo.createNote('scratch', otherUserId)).
      then(() => repo.searchNote(`author: ${userName}`, userId)).
      then(result => expect(result).toEqual([4,2])).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Protects note default/protected privacy', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    var noteId = -1;
    var userId = -1;
    var friendId = -1;

    return repo.setup().
      then(() => repo.createUser(userName, 's3cr3T')).
      then(id => {
        userId = id;
        friendId = userId + 1;
      }).
      then(() => repo.createNote('hello', userId)).
      then(id => noteId = id).
      then(() => repo.getNote(noteId, userId)).
      then(note => expect(note.id).toEqual(noteId)).
      then(() => repo.getNote(noteId, friendId)).
      then(note => expect(note).toBeUndefined()).
      then(() => repo.userSharesWith(userId, friendId)).
      then(() => repo.getNote(noteId, friendId)).
      then(note => expect(note.id).toEqual(noteId)).
      then(() => repo.userBlocks(userId, friendId)).
      then(note => expect(note).toBeUndefined()).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Protects note privacy', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    let noteId, userId, friendId;

    return repo.setup().
      then(() => repo.createUser(userName, 's3cr3T')).
      then(id => userId = id).
      then(() => repo.createUser(`Friend of ${userName}`, 'shhh3cr3T')).
      then(id => friendId = id).
      then(() => repo.createNote('hello', userId)).
      then(id => noteId = id).
      then(() => repo.setNotePrivate(noteId, userId)).
      then(() => repo.getNote(noteId, userId)).
      then(note => expect(note.id).toEqual(noteId)).
      then(() => repo.getNote(noteId, friendId)).
      then(note => expect(note).toBeUndefined()).
      then(() => repo.userSharesWith(userId, friendId)).
      then(() => repo.getNote(noteId, friendId)).
      then(note => expect(note).toBeUndefined()).
      then(() => repo.setNoteProtected(noteId, userId)).
      then(() => repo.getNote(noteId, friendId)).
      then(note => expect(note.id).toEqual(noteId)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Publishes public notes', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    var noteId = -1;
    var userId = -1;

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => {
        userId = id;
      }).
      then(() => repo.createNote('hello', userId)).
      then(id => noteId = id).
      then(() => repo.setNotePublic(noteId, userId)).
      then(() => repo.getNote(noteId, userId + 2)).
      then(note => expect(note.id).toEqual(noteId)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Sharing is idempotent', () => {
    const repo = new Repo({});
    const userName = 'Jonathan';
    const secret = 's3cr3T';
    var noteId = -1;
    var userId = -1;
    var friendId = -1;

    return repo.setup().
      then(() => repo.createUser(userName, secret)).
      then(id => {
        userId = id;
        friendId = userId + 1;
      }).
      then(() => repo.createNote('hello', userId)).
      then(id => noteId = id).
      then(() => repo.userSharesWith(userId, friendId)).
      then(() => repo.userSharesWith(userId, friendId)).
      then(() => repo.getNote(noteId, userId)).
      then(note => expect(note.id).toEqual(noteId)).
      then(() => repo.userBlocks(userId, friendId)).
      then(note => expect(note).toBeUndefined()).
      then(() => repo.userBlocks(userId, friendId)).
      then(() => repo.close()).
      catch(e => {
        repo.close();
        throw e;
      });
  });

  test('Uses secrets', () => {
    const repo = new Repo({});
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
    const repo = new Repo({});
    RepoStub.checkMethodNames(repo);
  });
});
