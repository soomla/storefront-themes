define("pirateRaceLandscapeViews", ["jquery", "backbone", "components", "handlebars", "templates", "jquery.fastbutton"], function($, Backbone, Components, Handlebars) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    // Define view types

    var getTemplate = Handlebars.getTemplate,
        VirtualGoodView = Components.SingleUseItemView.extend({ template : getTemplate("item") }),
        CategoryHeaderView = Components.LinkView.extend({
            tagName: "span",
            template: getTemplate("categoryHeader"),
            triggers: { "fastclick .category": "chooseCategory" }
        }),
        SectionedListView = Components.BaseCompositeView.extend({
            className           : "items", // clearfix
            template            : getTemplate("listContainer"),
            itemViewContainer   : ".container"
        }),
        EquippableVirtualGoodView   = Components.EquippableItemView.extend({ template : getTemplate("equippableItem")}),
        CurrencyPackView = Components.CurrencyPackView.extend({ template: getTemplate("currencyPack") });


    var extendViews = function(model) {

        var theme = model.assets.theme;
        var assets = model.assets;


        // Add template helpers to view prototypes

        var templateHelpers = function() {

            return _.extend({
                imgFilePath: assets.getItemAsset(this.model.id),
                backgroundImgFilePath: assets.getCategoryAsset(this.model.get("categoryId")),
                currency : {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                },
                price : this.model.get("priceModel").values[this.model.getCurrencyId()]

                // TODO: Move all properties under pages.goods.item and pages.currencyPacks.item and migrate DB
            }, theme.pages.goods.listItem);
        };

        CategoryHeaderView.prototype.templateHelpers = templateHelpers;
        VirtualGoodView.prototype.templateHelpers = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        CurrencyPackView.prototype.templateHelpers = function() {
            return {
                nameStyle       : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle      : theme.pages.currencyPacks.listItem.priceStyle,
                buy             : theme.pages.currencyPacks.listItem.buy,
                imgFilePath     : assets.getItemAsset(this.model.id),
                backgroundImgFilePath: eval('theme.currencyPacksCategoryImage_' + this.model.getCurrencyId())
            };
        };
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showGoodsStore");
            this.dialogModal = this.theme.pages.goods.noFundsModal;
            this.loadingModal = {
                "text": "Loading...",
                "background": this.dialogModal.background,
                "textStyle": this.dialogModal.textStyle
            };

            this.categoryHeaderViews = [];
            this.categoryViews  = [];

            var currencies      = this.model.getCurrencies(),
                categories      = this.model.getCategories();

            // View event listeners
            var wantsToBuyVirtualGoods = _.bind(function (view) {
                this.playSound().wantsToBuyVirtualGoods(view.model);
            }, this);
            var wantsToEquipGoods = _.bind(function (view) {
                this.playSound().wantsToEquipGoods(view.model);
            }, this);
            var wantsToBuyMarketItem = _.bind(function (view) {
                this.playSound().wantsToBuyMarketItem(view.model);
            }, this);
            var chooseCurrencyCategory = _.bind(function (view) {
                var currencyPacks = view.model.getPacks();
                _.each(this.currencyPacksViews, function (currencyPacksView) {
                    if (currencyPacks == currencyPacksView.collection) {
                        this.iscrolls.onlyOne.scrollToElement(currencyPacksView.el, 500);
                        return;
                    }
                }, this);
            }, this);
            var chooseCategory = _.bind(function (view) {
                var categroyGoods = view.model.getGoods();
                _.each(this.categoryViews, function (categoryView) {
                    if (categroyGoods == categoryView.collection) {
                        this.iscrolls.onlyOne.scrollToElement(categoryView.el, 500);
                        return;
                    }
                }, this);
            }, this);

            // Create category views
            var i = 0;
            this.numOfItems = 0;

            categories.each(function (category) {

                var headerView = new CategoryHeaderView({
                    model: category,
                    className: "categoryHeader",
                    templateHelpers: _.extend({ category: category.getName(), id: category.id, selected: (i++ == 0) ? "selected" : "" }, this.theme.categories)
                }).on("chooseCategory", chooseCategory);

                this.categoryHeaderViews.push(headerView);

                var categoryGoods   = category.getGoods(),
                    equipping       = category.get("equipping"),
                    view;
                this.numOfItems += (!!categoryGoods) ? categoryGoods.length : 0;

                if (equipping === "single") {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : EquippableVirtualGoodView,
                        templateHelpers     : _.extend({category : category.getName(), id: category.id}, this.theme.categories)
                    }).on({
                        "itemview:buy" 		: wantsToBuyVirtualGoods,
                        "itemview:equip" 	: wantsToEquipGoods
                    });
                } else {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     : _.extend({category : category.getName(), id: category.id}, this.theme.categories)
                    }).on("itemview:buy", wantsToBuyVirtualGoods);
                }
                this.categoryViews.push(view);
            }, this);

            var currencyIndex = 1;
            this.currencyPacksViews = [];
            currencies.each(function (currency) {
                var headerView = new CategoryHeaderView({
                    model: currency,
                    className: "currencyHeader",
                    templateHelpers: _.extend({ category: currency.getName(), id: currency.id, selected: "" }, this.theme.categories)
                }).on("chooseCategory", chooseCurrencyCategory);

                this.categoryHeaderViews.push(headerView);

                var packs = currency.getPacks();
                var numOfPacks = (!!packs) ? packs.length : 0;
                if (currencyIndex == currencies.length && numOfPacks > 0 && numOfPacks < 3) {
                    numOfPacks = 5; // add padding to the last pack
                }
                this.numOfItems += numOfPacks;

                var view = new SectionedListView({
                    className           : "items currencyPacks",
                    collection          : packs,
                    itemView            : CurrencyPackView,
                    templateHelpers: _.extend({ category: currency.getName(), id: currency.id, selected: ""}, this.theme.categories)
                }).on("itemview:buy", wantsToBuyMarketItem);

                this.currencyPacksViews.push(view);
                currencyIndex++;
            }, this);
        },
        events : {
            "fastclick .leave-store" : "leaveStore",
            "fastclick .buy-more"    : "onClickBuyMore",
            "fastclick .back"        : "showGoodsStore"
        },
        ui : {
            goodsStore: "#content-container",
            goodsHeader: "#content-container .header",
            goodsCategoriesHeader: "#content-container .header .categories",
            goodsIscrollContainer: "#content-container .items-container [data-iscroll='true']",
            currencyPacksContainer : ".currency-packs"
        },
        updateBalance : function(model) {
            // TODO: Move to a header view
            this.$(".balance-container label[data-currency='" + model.id + "']").html(model.getBalance());
        },
        onClickBuyMore : function() {
            this.showCurrencyPacks();
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var goodsItem = this.model.goodsMap[itemId];
            var currencyPacksItem = this.model.packsMap[itemId];
            var item = goodsItem || currencyPacksItem;
            if (!item) {
                console.log('View was not changed. Could not find item: "' + itemId + '".');
                return;
            }

            var catCurrViews = this.categoryViews.concat(this.currencyPacksViews);
            _.each(catCurrViews, function (catCurrView) {
                var itemView = catCurrView.children.findByModel(item);
                if (itemView) {
                    this.iscrolls.onlyOne.scrollToElement(itemView.el, 500);
                    return;
                }
            }, this);
        },
        showCurrencyPacks: function () {
            this.playSound();

            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").getName() + " is unavailable. Check your internet connectivity and try again.");
            } else {
                this.iscrolls.onlyOne.scrollToElement('.currencyPacks', 500);
            }
        },
        showGoodsStore : function() {
            this.playSound();
            this.ui.goodsStore.show();
            this.iscrolls.onlyOne.refresh();
        },
        iscrollRegions : {
            onlyOne : {
                el : "#content-container .items-container",
                options: {
                    snap: 'li',
                    hScroll: true, vScroll: false, hScrollbar: false, vScrollbar: false,
                    onScrollEnd: function ($this, iScroll) {
                        var itemWidth = 204; //TODO: Change "204" to @itemWidth.
                        var xPos = Math.max(0, (Math.abs(iScroll.x) + 3));
                        if (Math.abs(iScroll.x) > Math.abs(iScroll.maxScrollX) - 1) {
                            // Handle the edge case of getting to the end of the scroller.
                            xPos = iScroll.scroller.clientWidth - 1; 
                        }
                        var itemIndex = Math.floor(xPos / itemWidth);
                        var liElement = $('ul li', iScroll.scroller)[itemIndex];
                        var categoryId = $('> div', liElement).data('categoryid');
                        $('div .categories .selected').toggleClass('selected', false);

                        _.each($this.categoryHeaderViews, function (categoryHeaderView) {
                            if (categoryHeaderView.model.id == categoryId) {
                                $(categoryHeaderView.el.firstChild).toggleClass('selected', true);
                                return;
                            }
                        });
                    }
                }
            }
        },
        onRender : function() {
            // Render subviews (categories, items in goods store and currency store)
            _.each(this.categoryHeaderViews, function (view) {
                this.ui.goodsCategoriesHeader.append(view.render().el);
            }, this);

            //TODO: Change "204" to @itemWidth.
            var itemWidth = 204;
            this.ui.goodsIscrollContainer[0].style.width = this.numOfItems * itemWidth + 'px';

            _.each(this.categoryViews, function(view) {
                this.ui.goodsIscrollContainer.append(view.render().el);
            }, this);

            _.each(this.currencyPacksViews, function(view) {
                this.ui.goodsIscrollContainer.append(view.render().el);
            }, this);
        },
        zoomFunction: function () {
            return (innerWidth / innerHeight) > (1120/570) ? (innerHeight / 570) : (innerWidth / 1120);
        }
    });

    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});
