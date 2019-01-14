const exploranda = require('../lib/reporter');
const _ = require('lodash');
const moment = require('moment');

const commit = process.argv[2];

function dateRanges(start, rangeSize, ranges) {
  const now = moment();
  const newDate = moment(start).add(rangeSize, 'days');
  ranges = ranges || [];
  if (now.isAfter(newDate)) {
    ranges.push(
      `${start.format('YYYY-MM-DD')}:${newDate.format('YYYY-MM-DD')}`
    );
    return dateRanges(newDate, rangeSize, ranges)
  }
  ranges.push(
    `${start.format('YYYY-MM-DD')}:${now.format('YYYY-MM-DD')}`
  );
  return ranges;
}

function getRanges(commit, explorandaCommits, explorandaReleases) {
  const dateString = _.chain(explorandaCommits).find((c) => {
    return _.startsWith(c.sha, commit);
  }).get('commit.committer.date').value();

  const versionDates = _.chain(explorandaReleases[0].time)
  .map((v, k) => v)
  .uniq()
  .sort()
  .value();

  return dateRanges(
    moment(_.find(versionDates, (d) => d > dateString)),
    10
  );
}

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

const reporter = exploranda.Gopher(dependencies);

reporter.report();
