/// <reference path="typings/paging.d.ts" />
// Created by baihuibo on 16/3/29.
import {toJson, module} from "angular";
import defaults = require("lodash/defaults");
import "./paging.less";

const modName = 'paging';
const mod = module(modName, []);
export default modName;

/**
 * 分页
 * @examples
 *   html:
 *   <ul>
 *       <li ng-repeat="item in option.resultList">{{item}}</li>
 *   </ul>
 *
 *   <paging option="option"></paging>
 *
 *   script:
 *   class TestCtrl{
 *      public option:PagingOption = {};//分页配置
 *      constructor(public TestResource) {
 *          this.option.resource = TestResource;//赋值给分页配置
 *          this.option.format = (list:Interface[])=>{
 *              list.forEach(function(item){
 *                  item.attr = Number(item.attr);
 *              });
 *          };
 *      }
 *   }
 *
 */
mod.directive("paging", function () {
    var DEFAULTS = {
        method: 'get',
        limit: 10,
        total: 0,
        resultList: [],
        limitList: [10, 20, 30, 40, 50],
        pagingSize: 5,
        params: null,
        hideDesc: false,
        invokeParam: "paging",
        reloadAll: false
    };

    return {
        template: require('./paging.html'),
        scope: {
            option: "="//配置对象 {Paging}
        },
        link: function (scope: any, el, attr) {
            var option: PagingOption = scope.option = defaults(scope.option || {}, DEFAULTS);
            var pagingSize = option.pagingSize;
            scope.$watch('option.pagingSize', function (newVal, oldVal) {
                if (oldVal && newVal != oldVal) {
                    pagingSize = newVal;
                    option.goToPage('first', true);
                }
            });

            var limit = option.limit;
            scope.$watch('option.limit', function (newVal, oldVal) {
                if (oldVal && newVal != oldVal) {
                    limit = newVal;
                    option.goToPage('first', true);
                }
            });

            var loading;
            //读取对应页面的数据
            scope.goToPage = function (page, reload) {//to page data
                if (page < 0 || (option.totalPage && page >= option.totalPage) || (page == option.currentPage && !reload)) {
                    return;
                }

                var data = {
                    current: page,
                    limit: limit,
                    method: option.method,
                    reload: option.reloadAll || !!reload,
                    total: option.total,
                    params: toJson(option.params || {})
                };
                loading = true;
                option.resource[option.method](option.invokeParam, data,
                    function ({current, total, totalPage, data = []}: PagingResult) {
                        option.currentPage = current;
                        option.total = total;
                        option.totalPage = totalPage;
                        option.resultList = data.map(item => new option.resource(item));
                        if (typeof option.format === 'function') {
                            option.format(option.resultList);
                        }
                        initPageList(totalPage, current);
                        loading = false;
                    }, function () {
                        loading = false;
                    });
            };

            //监听是否有resource资源准备就绪
            scope.$watch('option.resource', function () {
                option.resource && scope.goToPage(0, true);
            });

            //刷新数据
            option.goToPage = function (page, reload) {
                if (!option.resource || loading) return;//不要重复加载,跳出方法
                switch (page) {
                    case "first" :
                        scope.goToPage(0, reload);
                        break;
                    case "last" :
                        scope.goToPage(option.totalPage - 1, reload);
                        break;
                    default:
                        scope.goToPage(option.currentPage, reload);
                }
            };

            //重新加载
            option.reload = function (reload) {
                scope.goToPage(option.currentPage, reload);
            };

            //读取显示范围
            scope.getDataRange = function (to) {
                var {currentPage, limit, total} = option;
                if (to) {
                    return currentPage * limit + limit > total ? total : currentPage * limit + limit;//结束
                } else {
                    //from
                    return currentPage * limit + 1;//开始
                }
            };

            var startFix, endFix, list;

            function initPageList(totalPage, currentPage) {//初始化分页器
                list = scope.pageList = [];

                startFix = endFix = Math.floor(pagingSize / 2);
                var test = startFix * 2 + 1;
                if (test > pagingSize) startFix -= 1;
                if (test < pagingSize) endFix += 1;

                var _sf = 0,
                    _ef = 0,
                    start = currentPage - startFix,
                    end = endFix + currentPage + 1;
                if (start < 0) {
                    _sf = 0 - start;
                    start = 0;
                }

                if (end >= totalPage) {
                    _ef = end - totalPage;
                    end = totalPage;
                }

                start = start - _ef;
                end = end + _sf;
                start = start < 0 ? 0 : start;
                end = end > totalPage ? totalPage : end;

                for (; start < end; start++) {
                    list.push(start);
                }
            }
        }
    }
});
