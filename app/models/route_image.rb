class RouteImage < ActiveRecord::Base
  belongs_to :route
  has_attached_file :image, :styles => { :small => "150x150>" }
  
  MAX_IMAGES_PER_ROUTE = 3
end
