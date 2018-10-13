const Repo = require('../src/pgNoteRepo');
const RepoStub = require('./inMemoryNoteRepo');

describe('Test Postgres note repository', () => {

  test('Has method implementations', () => {
    const repo = new Repo();
    RepoStub.checkMethodNames(repo);
  });

	test('Can create a note', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			one: (q) => {
				query = q;
				return Promise.resolve({id: 17});
			}
		};

		return repo.createNote('test note', 11)
			.then(result => {
				expect(result).toEqual(17)
				expect(query.includes('\'test note\'')).toBe(true);
			});
	});

	test('Can create a user', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			one: (q) => {
				query = q;
				return Promise.resolve({id: 17});
			}
		};

		return repo.createUser('bilbo', 'ee')
			.then(result => {
				expect(result).toEqual(17)
				expect(query.includes('\'bilbo\'')).toBe(true);
			});
	});


	test('Can retrieve a note', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			oneOrNone: (q) => {
				query = q;
				return Promise.resolve({
					author: 17,
					content: 'some content',
					created: 1234567,
					id: 29
				});
			}
		};

		return repo.getNote(29, 17)
			.then(result => {
				expect(result.author).toEqual(17)
				expect(query.includes('id = 29')).toBe(true);
			});
	});

	test('Can retrieve a user from name', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			oneOrNone: (q) => {
				query = q;
				return Promise.resolve({id: 17});
			}
		};

		return repo.getUserId('bilbo')
			.then(result => {
				expect(result).toEqual(17);
				expect(query.includes('userName = \'bilbo\'')).toBe(true);
			});
	});

	test('Can retrieve a user from id', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			oneOrNone: async (q) => {
				query = q;
				return Promise.resolve({ username: 'bilbo' });
			}
		};

		return repo.getUserName(17)
			.then(result => {
				expect(result).toEqual('bilbo');
				expect(query.includes('id = 17')).toBe(true);
			});
	});

	test('Can delete a note', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			none: (q) => {
				query = q;
			}
		};

		return repo.removeNote(17, 29)
			.then(() => {
				expect(query.includes('WHERE id = 17')).toBe(true);
			});
	});

	test('Can search for a note', () => {
    const repo = new Repo();
		let query;
		repo.db = {
			any: (q) => {
				query = q;
				return Promise.resolve([{id: 1}, {id: 7}, {id: 19}]);
			}
		};

		return repo.searchNote('content like \'%foo%\'', 29)
			.then(result => {
				expect(query.includes('WHERE content like \'%foo%\'')).toBe(true);
				expect(result).toEqual([1, 7, 19]);
			});
	});


});
