class AddImageToRouteImage < ActiveRecord::Migration
  def self.up
    add_attachment :route_images, :image
  end

  def self.down
    remove_attachment :route_images, :image
  end
end
