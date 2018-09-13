## Use with Postgres
- Clean out data/ directory.
- ```initdb -D data```
- Edit data/postgresql.conf, e.g. to lock down listen_addresses
- ```pg_ctl -D data/ -l log/postgres.log start```
- ```createdb yellow```
