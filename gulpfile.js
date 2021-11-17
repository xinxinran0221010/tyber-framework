/**
 * gulp处理ws-ts生成后的lib文件夹
 * 1. 将src里的所有文件全部复制出来
 * 2. 将package.json 和 README.MD两个文件复制至lib
 */
const gulp = require("gulp");
const addSrc = require("gulp-add-src");
const modifyJson = require("gulp-json-modify");

// 操作目录
const destination = "./lib";

gulp.task("copy", () => {
  gulp.src("./src/internal/web-requests/validation/LICENSE")
      .pipe(gulp.dest('./lib/src/internal/web-requests/validation/'));
  return gulp
    .src("./lib/src/**/*.*")
    .pipe(gulp.dest(destination))
    .pipe(addSrc(["./package.json", "./README.MD", "./LICENSE.MD"]))
    .pipe(gulp.dest(destination));
});
gulp.task("clean-scripts", () => {
  return gulp.src("./lib/package.json")
      .pipe(modifyJson({key: "scripts", value: {}}))
      .pipe(gulp.dest('./lib'));
});
