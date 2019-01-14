## Getting Started

Github, our lovely hosts, provide [API documentation](https://developer.github.com/v3/) for their
service. Though it's a bit harder to find, [so do the fine folks at npm](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md).
As an example project, we'll use Exploranda to collect information about
itself from those two sources. You'll need a recent version of NodeJS
and `npm`.

First, in a new directory, install exploranda:

`npm install --save exploranda`

Exploranda includes a set of built-in `accessSchema` objects for the
Github API. This tutorial will not go into detail on how to create them;
for that, see the [Creating AccessSchema Objects](creating-accessSchemas.md) documentation.

As a practice task, let's write a report that takes a commit hash
and figures out how many commits are before it in the repo, how many
are after it, and how many times in the past six months it has been
downloaded as part of the exploranda package from npm. We'll assume that
a commit is part of all downloads that happened after the release
following its addition to the repo (this is certainly not true for
any number of reasons, but whatever).

For this report, we'll need to determine when the commit showed up in the
repo. We'll also need the full list of npm releases. Then when we 
determine which releases occurred after the commit landed in the repo,
we'll need to retrieve download counts starting at the next release.

First we'll set up a blank script to work from. 


```javascript
const {Gopher} = require('exploranda');
const _ = require('lodash'); // I know I'm going to need it
const moment = require('moment') // will need this for time math 

// supply the commit as the first argument
const commit = process.argv[2];

const dependencies = {
};

const reporter = Gopher(dependencies);

reporter.report();
```

We can run this with `node <filename>` to ensure that it works.


```
raphael@phal:~/workspace/explorandaTest$ node test.js 
undefined
```

Next, we can add the dependencies for github and the npm releases--
the ones that don't depend on anything else. 

```javascript
const dependencies = {
  explorandaCommits: {
    accessSchema: exploranda.dataSources.github.commits.accessSchema,
    params: {
      owner: {value: 'RLuckom'},
      repo: {value: 'exploranda'}
    }
  },
  explorandaReleases: {
    accessSchema: exploranda.dataSources.npm.releases.accessSchema,
    params: {
      package: {value: 'exploranda'}
    }
  },
};
```

This defines two dependencies, each of which supplies `value` params
for its required parameters. For a list of the builtin `accessSchema`
objects and their required parameters, see the accessSchema.md docs.

If we run this script now, we will get a list of all of the npm releases of
exploranda and all of the commit objects from Github. As of this writing, there
are just under 80 commits, which means that with a page size of 30, it will take
3 requests to fetch all of them. We don't need to worry about that; the
Github commit `accessSchema` object includes information about how the Github
API is paginated, and exploranda uses that information to fetch all the pages
and combine them into one set of results. And because these dependencies do
not depend on each other, exploranda will fetch them in parallel.

Now let's add the dependency for the npm download count. The `accessSchema`
for npm download counts requires `package` and `range` parameters. The `range`
is a date range, specified as `YYYY-MM-DD:YYYY-MM-DD`. We need to use the 
result of the `explorandaCommits` dependency to determine when the commit
we're interested in was added to the repo. That will be the beginning
of the range, and the end will be the current date. Additionally, according
to the npm docs, the `range` may only be up to 18 months long.
Eventually, a commit that we choose will have been added to the repo
more than 18 months ago, so we should write our dependency so that it
does not try to use a `range` greater than 18 months even in that case.
We can write it as:

```javascript
const dependencies = {
  ...
  explorandaDownloadCounts: {
    accessSchema: exploranda.dataSources.npm.downloadCounts.accessSchema,
    params: {
      package: {value: 'exploranda'},
      range: {
        source: ['explorandaCommits', 'explorandaReleases'],
        formatter: ({explorandaCommits, explorandaReleases}) => {
          return getRanges(
            commit, explorandaCommits, explorandaReleases
          );
        }
      },
    }
  },
  ...
};
```

The `getRanges` function takes the commit, commit list, and release list
and returns an array of 10-day date ranges in the format specified by 
the npm download count API, from the date of the first release occurring after
the commit until the present. Exploranda understands that when a required
parameter is specified as an array, it should make one API call for _each_
element of the array (for cases where the parameter actually is an array,
the array-detection can be overridden in the `accessSchema` object). By
using an array of 10-day ranges to make multiple calls, we ensure that we
will never hit the 18-month limit for a single call. Just as with the commit
list and release list dependencies, exploranda will make these requests
in parallel.

Finally, it would be nice to consolidate the data we've received into
a single object. For this we can use a dependency making use of the `SYNTHETIC`
`dataSource`. That simply means that it does not fetch any data--it just
defines some params and uses an inline `accessSchema` with a `transformation`
function to turn its params into its result. The following dependency 
uses all of the other three dependencies to assemble a report on the commit we were
interested in, including the number of commits before it, the number of commits
after it, and the sum of the download counts reported by all the calls
to the download count API: 

```javascript
const dependencies = {
  ...
  commitStats: {
    accessSchema: {
      dataSource: 'SYNTHETIC',
      transformation: ({commit, downloads, commits}) => {
        const commitsBefore = _.filter(commits, (c) => {
          return moment(c.commit.committer.date)
          .isBefore(moment(commit.commit.committer.date));
        }).length;
        
        const commitsAfter = _.filter(commits, (c) => {
          return moment(c.commit.committer.date)
          .isAfter(moment(commit.commit.committer.date));
        }).length;
        
        return _.merge(
          {downloads, commitsBefore, commitsAfter},
          commit.commit
        );
      },
    },
    params: {
      commit: {
        source: 'explorandaCommits',
        formatter: ({explorandaCommits}) => {
          return _.find(
            explorandaCommits, (c) => _.startsWith(c.sha, commit)
          );
        }
      },
      commits: {
        source: 'explorandaCommits',
        formatter: ({explorandaCommits}) => explorandaCommits,
      },
      downloads: {
        source: 'explorandaDownloadCounts',
        formatter: ({explorandaDownloadCounts}) => {
          return _.sumBy(explorandaDownloadCounts, 'downloads');
        }
      }
    }
  }
};
```

The full code of this exercise can be found in [`../examples/gopherExample.js`](../examples/gopherExample.js) directory,
and further documentation can be found in the README.

