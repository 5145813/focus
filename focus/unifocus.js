$(function() {

	var o = {
		enableSelector : "td",
		groupSelector : "*[data-focus]",
		modalSelector : ".modal:visible",
		focusClass : "focus",
		enterKey : 13,
		precision : 10
	};

	var directions = {
		37 : "left",
		38 : "up",
		39 : "right",
		40 : "down"
	};

	var oldFocus = $.fn.focus;
	$.fn.focus = function() {
		if (0 == arguments.length) {
			new Focus().currentFocusItem().$el.removeClass(o.focusClass);
			var $this = $(this);
			$this.addClass(o.focusClass);
		}

		return oldFocus.apply(this, arguments);
	};
	// jQuery扩展
	$.fn.extend({
		isEmpty : function() {
			return 0 == this.length;
		},

		isGroup : function() {
			return $(this).is(o.groupSelector);
		}
	});

	var Rectangle = function(rect) {
		_.extend(this, rect);
	};

	Rectangle.prototype = {
		simpleDistance : function(direction, otherRect) {
			var pointA = this.getCenterPoint(direction);
			var pointB = otherRect.getCenterPoint(direction.getOppositeDirection());

			return this._simpleDistanceBetweenPoint(pointA, pointB);
		},

		_simpleDistanceBetweenPoint : function(pointA, pointB) {
			return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
		},

		axisDistance : function(direction, otherRect) {
			return Math.abs(this[direction.getName()] - otherRect[direction.getName()]);
		},

		isAfter : function(direction, otherRect) {
			return direction.getFactor() * (this[direction.getName()] - otherRect[direction.getName()]) > 0;
		},

		isBefore : function(direction, otherRect) {
			return !this.isAfter(direction, otherRect);
		},

		isOverlap : function(direction, otherRect) {
			var rotateDir = direction.getRotateDirection();
			var selfA = this[rotateDir.getName()];
			var selfB = this[rotateDir.getOppositeName()];
			var selfDistance = Math.abs(selfB - selfA);

			var otherA = otherRect[rotateDir.getName()];
			var otherB = otherRect[rotateDir.getOppositeName()];
			var otherDistance = Math.abs(otherB - otherA);

			var minA = Math.min.apply(null, [ selfA, selfB, otherA, otherB ]);
			var maxB = Math.max.apply(null, [ selfA, selfB, otherA, otherB ]);

			return Math.abs(maxB - minA) < (selfDistance + otherDistance);
		},

		getCenterPoint : function(direction) {

			var rotateDir = direction.getRotateDirection();
			var point = {};

			point[direction.getCoordName()] = this[direction.getName()];
			point[rotateDir.getCoordName()] = (this[rotateDir.getName()] + this[rotateDir.getOppositeName()]) / 2;

			return point;
		}
	};

	var Direction = function(keyCode) {
		this._keyCode = keyCode;
	};

	Direction.prototype = {
		getName : function() {
			return directions[this._keyCode];
		},

		getOppositeName : function() {
			return this.getOppositeDirection().getName();
		},

		getRotateName : function() {
			return this.getRotateDirection().getName();
		},

		getOppositeDirection : function() {
			return new Direction(37 + (this._keyCode + 1) % 4);
		},

		getRotateDirection : function() {
			return new Direction(this._keyCode + (0 == this._keyCode % 2 ? -1 : 1));
		},

		getFactor : function() {
			return _.include([ "up", "left" ], this.getName()) ? -1 : 1;
		},

		isHorizontal : function() {
			return _.include([ "left", "right" ], this.getName());
		},

		getCoordName : function() {
			return this.isHorizontal() ? "x" : "y";
		}

	};

	var FocusConfig = function(json) {
		_.extend(this, {
			cols : Number.MAX_VALUE
		}, json);
	};

	FocusConfig.prototype = {};

	var Item = function($el, $container) {
		this.$el = $el;
		this.$container = $container;
	};

	Item.prototype = {
		getConfig : function() {
			var cfg = this.$el.data("focus");
			if (_.isString(cfg)) {
				cfg = new Function("return " + cfg + ";")();
				this.$el.data("focus", cfg);
			}

			return new FocusConfig(cfg);
		},

		getParentGroup : function() {
			if (this.$el[0] == this.$container[0]) {
				return null;
			}

			var $group = this.$el.parents(o.groupSelector + ":first");
			if ($group.isEmpty()) {
				$group = this.$container;
			}

			return new Group($group, this.$container);
		},

		getConfiguredNextElement : function(direction) {
			var cfg = this.getConfig();
			var selector = cfg[direction.getName()];
			if (selector) {
				var $nextElement = $(selector).filter(":visible");
				if (!$nextElement.isEmpty()) {

					if ($nextElement.isGroup()) {
						return new Group($nextElement, this.$container);
					} else {
						return new Item($nextElement, this.$container);
					}
				}
			}

			return null;
		},

		setFocus : function(direction, focusItem) {
			if (this.$el[0] == focusItem.$el[0]) {
				var next = this.getConfiguredNextElement(direction);
				if (next) {
					next.setFocus(direction, focusItem);
				} else {
					this.getParentGroup().setFocus(direction, focusItem);
				}
			} else {
				this.$el.focus();
			}
		},

		getRect : function() {
			if (!this._rect) {
				var rectJSON = this.$el[0].getBoundingClientRect();
				rectJSON.up = rectJSON.top;
				rectJSON.down = rectJSON.bottom;

				this._rect = new Rectangle(rectJSON);
			}

			return this._rect;
		},

		hasChild : function() {
			return false;
		}

	};

	var Group = function($el, $container) {
		this.$el = $el;
		this.$container = $container;
	};

	_.extend(Group.prototype, Item.prototype, {

		hasChild : function(obj) {
			return $.contains(this.$el[0], obj.$el[0]);
		},

		getChildList : function() {
			var $container = this.$container;
			var $el = this.$el;
			var list = $el.find(o.enableSelector + "," + o.groupSelector).filter(":visible").map(function() {
				if ($(this).isGroup()) {
					return new Group($(this), $container);
				} else {
					return new Item($(this), $container);
				}
			});

			return _.filter(list, function(child) {
				return child.getParentGroup().$el[0] == $el[0];
			});
		},

		setFocus : function(direction, focusItem) {
			var self = this;
			var childList = this.getChildList();
			var totalCount = childList.length;
			var index = -1;

			var config = this.getConfig();

			if (!nextObject) {
				if (_.find(childList, function(child) {
					index++;
					return child.$el[0] == focusItem.$el[0];
				})) {

					// 单行或水平移动
					if (direction.isHorizontal()) {
						var nextIndex = (index + direction.getFactor() + totalCount) % totalCount;
					} else {
						if (totalCount > config.cols) {
							var nextIndex = index + direction.getFactor() * config.cols;
							if (nextIndex < Math.ceil(totalCount / config.cols) * config.cols) {
								nextIndex = Math.min(totalCount - 1, nextIndex);
							}
						}
					}

					if (nextIndex >= 0 && nextIndex < totalCount) {
						nextObject = childList[nextIndex];
					}
				} else {

					nextObject = childList[config.index];

					if (!nextObject) {
						var focusRect = focusItem.getRect();
						childList = _.filter(childList, function(child) {
							return !child.hasChild(focusItem) && focusRect.isBefore(direction, child.getRect());
						});

						var overlapChildList = _.filter(childList, function(child) {
							return focusRect.isOverlap(direction, child.getRect());
						});

						if (!_.isEmpty(overlapChildList)) {
							childList = overlapChildList;
							childList.sort(function(a, b) {
								var distanceA = focusRect.axisDistance(direction, a.getRect());
								var distanceB = focusRect.axisDistance(direction, b.getRect());
								return distanceA - distanceB;
							});

						} else {

							childList.sort(function(a, b) {
								var distanceA = focusRect.simpleDistance(direction, a.getRect());
								var distanceB = focusRect.simpleDistance(direction, b.getRect());
								return distanceA - distanceB;
							});
						}

						nextObject = childList[0];
					}

				}
			}

			if (!nextObject) {
				var nextObject = this.getConfiguredNextElement(direction);
				if (!nextObject) {
					nextObject = this.getParentGroup();
				}
			}

			if (nextObject) {
				nextObject.setFocus(direction, focusItem);
			}
		}
	});

	var Focus = function() {
		this.$el = $("body");
		if (!$(o.modalSelector).isEmpty()) {
			this.$el = $(o.modalSelector);
		}
	};

	Focus.prototype = {
		currentFocusItem : function() {
			var $focus = this.$el.find("." + o.focusClass).filter(":visible");

			if ($focus.isEmpty()) {
				this.$el.find(o.enableSelector).first().addClass(o.focusClass);
				return null;
			} else {
				return new Item($focus, this.$el);
			}
		},

		setFocus : function(direction) {
			var focusItem = this.currentFocusItem();
			if (!focusItem) {
				return;
			}

			focusItem.setFocus(direction, focusItem);
		}
	};

	$(document).on("keydown", function(e) {
		var keyCode = e.keyCode;
		if (keyCode in directions) {
			new Focus().setFocus(new Direction(keyCode));
		}
	});

	window.Focus = {
		start : function(options) {
			_.extend(o, options);

		}
	};
});