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
