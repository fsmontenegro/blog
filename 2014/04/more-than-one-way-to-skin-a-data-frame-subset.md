Title: More Than One Way To Skin (and time) A Data Frame Subset
Date: 2014-04-03 16:11:47
Category: analysis
Tags: R, Fundamentals
Slug: more-than-one-way-to-skin-a-data-frame-subset
Author: Bob Rudis (@hrbrmstr)

There was an interesting question recently on [StackOverlow](http://stackoverflow.com/q/22775269/1457051) on how to apply a function over a rolling window on a column in a data frame grouped by subset. It was a pretty vanilla SO question as those things go, but there were no less than four useful and diferent answers to it which, I believe, shows the power and flexibility of R.

All of them used either the `rollapply` or `rollapplyr` functions from the [zoo](http://cran.r-project.org/web/packages/zoo/index.html) package, and each handles the "rolling window" component (the "hard work"). There were three different approaches to performing the subset and applying the `rollapply/sd` combo across the four solutions:

- using `ave` (either with `with` or w/o it)
- using `by`
- using `ddply` from the `plyr` package

The short description of the `ave` function--*"Group Averages Over Level Combinations of Factors"*--hides the fact that it's really a generic function that will do subsetting of the first argument by the factors provided in the following arguments using `FUN=mean` as the default function to call. You can use **any** function (like `sd` in this case) instead, which might not be obvious to new R users. Two of the answers used `ave` with minor differences (but different enough to show below).

I think `by` is an oft-neglected function since the `plyr` functions came about, but it's a workhorse and gets the job done pretty well here (with the help of `unlist`).

The `ddply` solution is equally as straightforward and self-explanatory as the other three.

Given how close they all were syntactic impmementation, I wanted to see if there was a difference under the covers speed-wise, so I modified the orignial example data frame (made it bigger and slightly more complex with four factors instead of two) and used each differnet method to create a new column (100x) and captured the results to compare. The `system.time` function is often called in a standalone context, but when not printing basic timing stats to `stdout` it returns an object of class `proc_time` which has five vales (of which two are only relevant to our testing).


```r
library(zoo)  # for rollapply()

set.seed(1492)

category <- rep(sample(c("A", "B", "C", "D"), 20000, replace = TRUE))
year <- rep(sample(c(1990, 1991, 1992, 1993, 1990, 1991, 1992, 1993), 20000, 
    replace = TRUE))
value <- rep(sample(c(2, 3, 5, 6, 8, 9, 4, 5), 20000, replace = TRUE))

df <- data.frame(category, year, value)

# run rolling sd calculation 100x for each method and capture results in
# data frames <<- is needed to modify df system.time does the timing lapply
# runs the code 100x and shoves the results into a list ldply turns the list
# into a data frame lather, rinse, repeat

t.with <- ldply(lapply(1:100, function(x) system.time(df$stdev.with <<- with(df, 
    ave(value, category, FUN = function(x) c(NA, rollapply(x, width = 2, sd)))))))
    
t.ave <- ldply(lapply(1:100, function(x) system.time(df$stdev.ave <<- ave(df$value, 
    df$category, FUN = function(x) rollapplyr(x, 2, sd, fill = NA)))))
    
t.by <- ldply(lapply(1:100, function(x) system.time(df$stdev.by <<- unlist(by(df, 
    df$category, function(x) c(NA, rollapply(x$value, width = 2, sd)))))))
    
t.ddply <- ldply(lapply(1:100, function(x) system.time(df$stdev.ddply <<- ddply(df, 
    .(category), mutate, stdev = rollapplyr(value, width = 2, sd, fill = NA))$stdev)))

# prepare & crunch some data
# melt so we can use geom_barplot easily
t.with <- melt(t.with)
t.ave <- melt(t.ave)
t.by <- melt(t.by)
t.ddply <- melt(t.ddply)

# add a column we can facet on to show each method
t.with$method <- "with"
t.ave$method <- "ave"
t.by$method <- "by"
t.ddply$method <- "ddply"

# combine all the timing data sets
dat <- rbind(t.with, t.ave, t.by, t.ddply)
# sys.self, etc aren't useful for this analysis
dat <- dat[!(dat$variable %in% c("sys.self", "user.child", "sys.child")), ]

# put the factors in a particular order for the ggplot
dat$method <- factor(dat$method, levels = c("with", "ave", "by", "ddply"))
```



```r
# make the actual plot of crunched stats
gg <- ggplot(data = dat, aes(factor(variable), value))
gg <- gg + geom_boxplot(aes(color = method))
gg <- gg + facet_wrap(~method, ncol = 4)
gg <- gg + labs(x = "", y = "# secs")
gg <- gg + theme_bw()
gg <- gg + theme(legend.position = "none", strip.background = element_blank())
gg
```

<a class="mag" href="/blog/images/2014/04/subset-stats.svg"><img src="/blog/images/2014/04/subset-stats.svg"></a>

While they are all pretty speedy, the `with/ave` combo consistently "wins" when I run this test code. The `by` method always comes in second each time as well. The `ddply` method is consistently the slowest, but none of them are laggards.

This was a pretty fun exercise and reinforces my belief that taking a stab at answering SO questions is a pretty neat way to see how others "think" in R and can help you see solutions from different perspectives. Plus, it can lead you down a path to discovery in terms of finding an optimal way of solving a problem.
