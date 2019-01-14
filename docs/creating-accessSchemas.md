## Creating `accessSchema` Objects

This tutorial describes how to create generic accessSchema objects using Github
as an example API. For complete documentation of all available `accessSchema`
settings, see the `accessSchema` section in the README.

This tutorial is going to go over the process of creating `accessSchema` objects
for the Github API. Because this is an HTTPS-based API that isn't internally 
inconsistent enough to warrant its own Nodejs SDK (*cough* AWS *cough*), the 
easiest way to write `accessSchema`s for it is to use the `GENERIC_API` `dataSource`.

I find that it's easiest to start with a blank script, so I can test out
my progress as I go. After running `npm install --save exploranda lodash`,
I can use a `Gopher` object to fetch an empty dependency graph to make sure
everything's working:

```javascript
const {Gopher} = require('exploranda');
const _ = require('lodash'); // I know I'm going to need it

const dependencies = {
};

const reporter = Gopher(dependencies);

reporter.report();
```

Since the graph is empty, I can run the script but I won't get any
results:

```
raphael@phal:~/workspace/explorandaTest$ node test.js 
undefined
```

Now that I have a way to validate my work, I can start adding support
for the API. I'm going to start with an accessSchema for getting a 
repository. According to the [docs](https://developer.github.com/v3/repos/#get)
getting a repo means making a call to the `/repos/:owner/:repo` endpoint.
The `accessSchema` can capture the hostname, path pattern, and the fact
that `owner` and `repo` are required parameters:

```javascript
const repoAccessSchema = {
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}',
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  pathParamKeys: ['owner', 'repo'],
};
```

Then we can use the `repoAccessSchema` to create a dependency in our graph:

```javascript
const dependencies = {
  explorandaRepo: {
    accessSchema: repoAccessSchema,
    params: {
      owner: {value: 'RLuckom'},
      repo: {value: 'exploranda'}
    }
  },
};
```

Sweet. Let's run it and see what happens!

```
raphael@phal:~/workspace/explorandaTest$ node test.js 
Results:
{
  "explorandaRepo": [
    {
      "body": "Request forbidden by administrative rules. Please make sure your request has a User-Agent header (http://developer.github.com/v3/#user-agent-required). Check https://developer.github.com for other possible causes.\n",
      "statusCode": 403,
      "headers": {
        "cache-control": "no-cache",
        "connection": "close",
        "content-type": "text/html"
      }
    }
  ]
}
```

An error! Neat! Github says we need to add a `User-Agent` header so they can
monitor API usage patterns. I can relate to that. Let's give `User-Agent` 
a default of `exploranda` and add 'User-Agent' to the list of parameters
that should be included in the request as headers:

```javascript
const repoAccessSchema = {
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}',
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  params: {
    'User-Agent': 'exploranda'
  },
  pathParamKeys: ['owner', 'repo'],
  headerParamKeys: ['User-Agent'],
};
```

It works! Now I see

```
raphael@phal:~/workspace/explorandaTest$ node test.js 
Results:
{
  "explorandaRepo": [
    {
      "body": {
        ...
      },
      "statusCode": 200,
      "headers": {
        ...
      }
    }
  ]
}
```

This is great, but we don't really care about the `headers` and `statusCode` 
after we're done making the request. Let's add the `value` field to the 
`accessSchema` so that it will unwrap the value automatically:

```javascript
const repoAccessSchema = {
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}',
  value: {path: 'body'},
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  params: {
    'User-Agent': 'exploranda'
  },
  pathParamKeys: ['owner', 'repo'],
  headerParamKeys: ['User-Agent'],
};
```


Now when I run the script, I see:

```
iraphael@phal:~/workspace/explorandaTest$ node test.js
Results:
{
  "explorandaRepo": [
    {
      "id": 148854763,
      "node_id": "MDEwOlJlcG9zaXRvcnkxNDg4NTQ3NjM=",
      "name": "exploranda",
      "full_name": "RLuckom/exploranda",
      "private": false,
      ...
    }
  ]
}
```

That's it--we have an `accessSchema` object that encapsulates all the parts of
getting a repo that _won't_ change, and we can use it in dependency objects
to get a _specific_ repo (or more than one!). Let's move on to a paginated
API path so that we can see an example of a more complicated `accessSchema`. The obvious choice is the [commit endpoint](https://developer.github.com/v3/repos/commits/).

According to the docs, listing the commits on a repository requires
making a call to the `/repos/:owner/:repo/commits` endpoint. It's similar
enough that we can start out by copying the `repoAccessSchema` and just
modifying the `path`:

```javascript
const commitsAccessSchema = {
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}/commits',
  value: {path: 'body'},
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  params: {
    'User-Agent': 'exploranda'
  },
  pathParamKeys: ['owner', 'repo'],
  headerParamKeys: ['User-Agent'],
};
```

This seems to work, but you'll notice we only get 30 commits back. We're
being paginated! Let's see what the API docs have to say about 
[pagination](https://developer.github.com/v3/#pagination). Sure enough,
"Requests that return multiple items will be paginated to 30 items by 
default. You can specify further pages with the `?page` parameter. " A
bit more digging leads to the [traversing with pagination](https://developer.github.com/v3/guides/traversing-with-pagination/)
page, which explains that the RFC 5988 `link` header will contain 
information required to make subsequent calls--a wonderful example of
how "standards" will proliferate until everyone has their own.
Since noticing this, Exploranda now parses `link` headers, and we can
modify the `commitsAccessSchema` to use the values we find there:

```javascript
const commitsAccessSchema = {
  dataSource: 'GENERIC_API',
  host: 'api.github.com',
  path: '/repos/${owner}/${repo}/commits',
  incompleteIndicator: 'headers.link.next',
  nextBatchParamConstructor: (currentParameters, response) => {
    const next = response.headers.link.next;
    const nextParams = {
      apiConfig: {
        host: next.url.host,
        path: next.url.pathName,
      },
      page: next.page
    };
    return _.merge({}, currentParameters, nextParams)
  },
  //value: {path: 'body'},
  requiredParams: {
    owner: {
      description: "github username of the repo owner"
    },
    repo: {
      description: "repo name"
    },
  },
  params: {
    'User-Agent': 'exploranda'
  },
  pathParamKeys: ['owner', 'repo'],
  queryParamKeys: ['page'],
  headerParamKeys: ['User-Agent'],
};
```

Here we've added an `incompleteIndicator` specifying a path on the 
response object to check to see if the response is incomplete. We've
added a `nextBatchParamConstructor` to construct the parameters for 
the next batch of results (the `apiConfig` is often an important 
parameter, about which more in the README). And we've added the `page`
url parameter to the list of `queryParamKeys`. Now exploranda
knows how to use the `link` header to fetch the next page of results
until it gets to the end.

To be honest, the `link` header strikes me as a remarkably poor implementation
of pagination--it uses a separate channel (the header) when it has a 
perfectly good main channel (the response body) it could use, it asks
that we "Don't try to guess or construct your own URL." which would
greatly restrict our ability to use additional query parameters,
and it doesn't really give us any meaningful metadata we are "allowed"
to use--but the point of exploranda is that none of that slows us down. When we
encounter baffling design decisions, we don't try to fight them. We just 
shake our heads, pick a spot for them on the reuse hierarchy between
a `recordCollector` function and an individual dependency object, write
them up once, and forget them.
