## [1.2.1](https://github.com/momolibrary/md-to-mowen/compare/v1.2.0...v1.2.1) (2026-05-14)


### Bug Fixes

* add header image ([314728e](https://github.com/momolibrary/md-to-mowen/commit/314728ee91627e16cfba2bb1d49dc610e6ad7c86))

# [1.2.0](https://github.com/momolibrary/md-to-mowen/compare/v1.1.1...v1.2.0) (2026-05-06)


### Features

* 元数据文件原子写入与备份 (#MAR-4) ([781bb6c](https://github.com/momolibrary/md-to-mowen/commit/781bb6cb117605b41b0e7a52dad51f186eb84c4b)), closes [#MAR-4](https://github.com/momolibrary/md-to-mowen/issues/MAR-4)
* 元数据文件并发写入锁 (#MAR-5) ([a90bb70](https://github.com/momolibrary/md-to-mowen/commit/a90bb70805ada44d24d82300e501bbca6689cca9)), closes [#MAR-5](https://github.com/momolibrary/md-to-mowen/issues/MAR-5)
* 支持批量发布整个目录的 Markdown 文件 ([#2](https://github.com/momolibrary/md-to-mowen/issues/2)) ([c1067d4](https://github.com/momolibrary/md-to-mowen/commit/c1067d4d204b17ec95065bc19a8670594ed16536))
* 支持独立的隐私设置命令 ([2153bf8](https://github.com/momolibrary/md-to-mowen/commit/2153bf8747be22f03903486b4fd1a4b41f241da2))
* 支持配置文件持久化常用选项 ([d26b5d9](https://github.com/momolibrary/md-to-mowen/commit/d26b5d9507ccf9b81206a2abc16a51a8b7c58b47))

## [1.1.1](https://github.com/momolibrary/md-to-mowen/compare/v1.1.0...v1.1.1) (2026-05-05)


### Bug Fixes

* 取消过期 release 任务避免分支落后 ([629716b](https://github.com/momolibrary/md-to-mowen/commit/629716ba97274c0f7e531a981b3ab32ca65a75b3))

# [1.1.0](https://github.com/momolibrary/md-to-mowen/compare/v1.0.2...v1.1.0) (2026-05-05)


### Features

* 支持元数据持久化，自动追踪 file→noteId 映射 ([#1](https://github.com/momolibrary/md-to-mowen/issues/1)) ([cb10c55](https://github.com/momolibrary/md-to-mowen/commit/cb10c557b968558524dd345fac72be0e611238c1))

## [1.0.2](https://github.com/momolibrary/md-to-mowen/compare/v1.0.1...v1.0.2) (2026-05-05)


### Bug Fixes

* add metadata.json to .gitignore ([fdeff2b](https://github.com/momolibrary/md-to-mowen/commit/fdeff2bf9e3d97a5b717b7f4d6876282ae7ccb70))

## [1.0.1](https://github.com/momolibrary/md-to-mowen/compare/v1.0.0...v1.0.1) (2026-05-04)


### Bug Fixes

* exclude pipeline cache from npm package ([73ae925](https://github.com/momolibrary/md-to-mowen/commit/73ae92514ae5f6741b0fbfcecbc153e3e4e99176))

# 1.0.0 (2026-05-04)


### Bug Fixes

* load .env from project root, not cwd ([eae4276](https://github.com/momolibrary/md-to-mowen/commit/eae42763c8da0157ce9fe296305c6f8c2c3051f7))
* resolve all TypeScript strict type errors for build ([af7d533](https://github.com/momolibrary/md-to-mowen/commit/af7d5339b4c0407e24256d2d215bc8df14766939))
* resolve upload pipeline issues for full sample.md publish ([81bea7e](https://github.com/momolibrary/md-to-mowen/commit/81bea7ef7a967ac37b31e6dcdcd9010713f7dc4c))


### Features

* add audio node support with show-note (MAST + NoteAtom + pipeline) ([2a9f4e0](https://github.com/momolibrary/md-to-mowen/commit/2a9f4e02d6b6fffb2b9fa38b5364d699740792d6))
* add bidirectional conversion (NoteAtom → MAST → Markdown) ([2d2bcd1](https://github.com/momolibrary/md-to-mowen/commit/2d2bcd10a49f7b385ce1e263aa158dd32dd93f41))
* add config command and multi-path .env search ([6f844a1](https://github.com/momolibrary/md-to-mowen/commit/6f844a180a7f6981283cd5f1f4322f2647f43d97))
* add publishMdToMowen API and to-markdown CLI command ([6f40752](https://github.com/momolibrary/md-to-mowen/commit/6f407527a48ca802fa554bcd38d936ad2d816532))
* implement pipeline stage 2 — Markdown → HAST → MAST ([7f234d9](https://github.com/momolibrary/md-to-mowen/commit/7f234d9cecbdb45af32d6901f8ae480dded8b7b8))
* implement pipeline stage 3 — asset processing ([2fbd995](https://github.com/momolibrary/md-to-mowen/commit/2fbd99582b51b18d671527468abdf501394d5fc9))
* implement pipeline stages 4-5 + dry-run mode ([f04655b](https://github.com/momolibrary/md-to-mowen/commit/f04655bba304bdeecab67a12d5af76a36f0e048d))
* make CLI globally runnable via npm link ([2df3529](https://github.com/momolibrary/md-to-mowen/commit/2df35295a5ae1b50039dc5a019db093d70b41435))
* write pipeline cache to out/pipeline-cache/ by default ([ab8d819](https://github.com/momolibrary/md-to-mowen/commit/ab8d819294aa20de49ab71c614fdfc308cee9ecd))
