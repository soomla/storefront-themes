define(["jquery", "backbone", "components", "marionette", "handlebars", "templates"], function($, Backbone, Components, Marionette, Handlebars) {

    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showCurrencyStore", "showGoodsStore", "leaveStore");
            this.dialogModel    = this.theme.pages.goods.noFundsModal;
            this.categoryViews  = [];

            var $this        = this,
                currencies   = this.model.get("virtualCurrencies"),
                categories   = this.model.get("categories"),
                modelAssets  = this.model.get("modelAssets");


            var sharedGoodsOptions = {
                template        : Handlebars.getTemplate("item"),
                templateHelpers : function() {
                    return _.extend({
                        imgFilePath : modelAssets["virtualGoods"][this.model.id],
                        currency : {
                            imgFilePath : modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                        },
                        price : this.model.get("priceModel").values[this.model.getCurrencyId()],
                        balanceLabelStyle   : $this.theme.common.balanceLabelStyle,
                        itemSeparator       : $this.theme.itemSeparator
                    }, $this.theme.pages.goods.listItem);
                },
                css : { "background-image" : "url('" + $this.theme.pages.goods.listItem.background + "')" }
            };
            var VirtualGoodView = Components.ListItemView.extend(_.extend({
                triggers : {
                    "click .buy" : "buy"
                }
            }, sharedGoodsOptions));

            var EquippableVirtualGoodView = Components.EquippableListItemView.extend(sharedGoodsOptions);

            var CurrencyPackView = Components.ListItemView.extend({
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers : function() {
                    return {
                        nameStyle       : $this.theme.pages.currencyPacks.listItem.nameStyle,
                        priceStyle      : $this.theme.pages.currencyPacks.listItem.priceStyle,
                        itemSeparator   : $this.theme.itemSeparator,
                        imgFilePath : modelAssets["currencyPacks"][this.model.id]
                    };
                },
                css             : { "background-image" : "url('" + this.theme.pages.currencyPacks.listItem.balanceBackground + "')" }
            });

            var SectionedListView = Marionette.CompositeView.extend({
                tagName             : "div",
                className           : "items virtualGoods",
                template            : Handlebars.getTemplate("listContainer"),
                itemViewContainer   : ".container"
            });

            categories.each(function(category) {
                categoryGoods = category.get("goods");
                var view;

                if (category.get("name") != "FRIENDS") {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     :_.extend({category : category.get("name")}, $this.theme.categories)
                    }).on("buy", function(model) { $this.playSound().wantsToBuyVirtualGoods(model); });
                } else {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : EquippableVirtualGoodView,
                        templateHelpers     :_.extend({category : category.get("name")}, $this.theme.categories)
                    }).on({
                        "buy" : function(model) { $this.playSound().wantsToBuyVirtualGoods(model); },
                        "itemview:equip" : function(view) {
                            $this.playSound().wantsToEquipGoods(view.model);
                        },
                        "itemview:equipped" : function(view) {

                            // Make sure to UI-unequip the previous one
                            if (this.equippedView) {
                                this.equippedView.model.set("equipped", false);
                            }
                            this.equippedView = view;
                        }
                    });
                }
                $this.categoryViews.push(view);
            });
            this.currencyPacksView = new Components.CollectionListView({
                className           : "items currencyPacks",
                collection          : currencies.at(0).get("packs"),
                itemView            : CurrencyPackView
            }).on("selected", function(model) {
                this.playSound().wantsToBuyCurrencyPacks(model);
            }, this);

        },
        events : {
            "touchend .leave-store" : "leaveStore",
            "touchend .buy-more"    : "showCurrencyStore",
            "touchend .back"        : "showGoodsStore"
        },
        updateBalance : function(model) {
            this.$(".balance-container label").html(model.get("balance"));
        },
        showCurrencyStore : function() {
            this.playSound();

            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").get("name") + " is unavailable. Check your internet connectivity and try again.");
            } else {
                this.$("#goods-store").hide();
                this.$("#currency-store").show();
            }
        },
        showGoodsStore : function() {
            this.playSound();
            this.$("#currency-store").hide();
            this.$("#goods-store").show();
        },
        leaveStore : function() {
            this.playSound().wantsToLeaveStore();
        },
        onRender : function() {
            var $this = this;
            this.$("#currency-store").hide();

            // Render subviews (items in goods store and currency store)
            _.each(this.categoryViews, function(view) {
                $this.$("#goods-store .items-container").append(view.render().el);
            });
            this.$("#currency-store .items-container").html(this.currencyPacksView.render().el);
        },
        zoomFunction : function() {
            return Math.min(innerWidth / 560, 1);
        }
    });

    return {
        StoreView : StoreView
    };
});

// grunt-rigger directive:
//= handlebars-templates
