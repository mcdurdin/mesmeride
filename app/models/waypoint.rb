class Waypoint < ActiveRecord::Base
  belongs_to :route
  default_scope -> { order('distance ASC') }
end
