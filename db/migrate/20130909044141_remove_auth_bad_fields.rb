class RemoveAuthBadFields < ActiveRecord::Migration
  def change
    remove_column :authentications, :index
    remove_column :authentications, :create
    remove_column :authentications, :destroy
  end
end
